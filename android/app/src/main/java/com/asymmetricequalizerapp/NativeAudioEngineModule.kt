package com.asymmetricequalizerapp

import android.content.Context
import android.media.AudioAttributes
import android.media.AudioFormat
import android.media.AudioManager
import android.media.AudioRecord
import android.media.AudioTrack
import android.media.MediaRecorder
import android.media.audiofx.Equalizer
import android.os.Build
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReadableArray
import kotlin.math.*

class NativeAudioEngineModule(reactContext: ReactApplicationContext) : ReactContextBaseJavaModule(reactContext) {

    private val SAMPLE_RATE = 44100
    private val CLINICAL_FREQUENCIES = doubleArrayOf(
        125.0, 250.0, 500.0, 750.0, 1000.0, 1500.0, 2000.0, 3000.0, 4000.0, 6000.0, 8000.0
    )

    // ─── Estado ─────────────────────────────────────────────────────────────────
    private var globalEqualizer: Equalizer? = null
    private var testAudioTrack: AudioTrack? = null
    private var audioManager: AudioManager? = null
    private var audioFocusRequest: android.media.AudioFocusRequest? = null

    @Volatile private var isAmbientRunning = false
    @Volatile private var ambientLeftGains  = DoubleArray(11)
    @Volatile private var ambientRightGains = DoubleArray(11)
    private var ambientRecord: AudioRecord? = null
    private var ambientTrack: AudioTrack? = null

    // ─── Filtro Biquad Peaking EQ (DSP) ─────────────────────────────────────────
    inner class BiquadFilter(private val frequency: Double) {
        private var b0 = 1.0; private var b1 = 0.0; private var b2 = 0.0
        private var a1 = 0.0; private var a2 = 0.0
        private var x1 = 0.0; private var x2 = 0.0
        private var y1 = 0.0; private var y2 = 0.0

        fun setGain(gainDb: Double, Q: Double = 1.4) {
            if (abs(gainDb) < 0.1) {
                b0 = 1.0; b1 = 0.0; b2 = 0.0; a1 = 0.0; a2 = 0.0; return
            }
            val A     = 10.0.pow(gainDb / 40.0)
            val w0    = 2 * PI * frequency / SAMPLE_RATE
            val alpha = sin(w0) / (2 * Q)
            val cosW0 = cos(w0)
            val a0    = 1 + alpha / A
            b0 =  (1 + alpha * A) / a0
            b1 = (-2 * cosW0)     / a0
            b2 =  (1 - alpha * A) / a0
            a1 = (-2 * cosW0)     / a0
            a2 =  (1 - alpha / A) / a0
        }

        fun process(x: Double): Double {
            val y = b0 * x + b1 * x1 + b2 * x2 - a1 * y1 - a2 * y2
            x2 = x1; x1 = x
            y2 = y1; y1 = y
            return y.coerceIn(-1.0, 1.0)
        }
    }

    override fun getName(): String = "NativeAudioEngine"

    // ─── Audio Focus ──────────────────────────────────────────────────────────
    private fun am(): AudioManager {
        if (audioManager == null)
            audioManager = reactApplicationContext.getSystemService(Context.AUDIO_SERVICE) as AudioManager
        return audioManager!!
    }

    private fun requestFocus() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            val attrs = AudioAttributes.Builder()
                .setUsage(AudioAttributes.USAGE_MEDIA)
                .setContentType(AudioAttributes.CONTENT_TYPE_MUSIC)
                .build()
            val req = android.media.AudioFocusRequest.Builder(AudioManager.AUDIOFOCUS_GAIN)
                .setAudioAttributes(attrs)
                .setAcceptsDelayedFocusGain(true)
                .setOnAudioFocusChangeListener {}
                .build()
            audioFocusRequest = req
            am().requestAudioFocus(req)
        } else {
            @Suppress("DEPRECATION")
            am().requestAudioFocus(null, AudioManager.STREAM_MUSIC, AudioManager.AUDIOFOCUS_GAIN)
        }
    }

    private fun abandonFocus() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            audioFocusRequest?.let { am().abandonAudioFocusRequest(it) }
        } else {
            @Suppress("DEPRECATION")
            am().abandonAudioFocus(null)
        }
    }

    // ─── Ecualizador Global — Opción B ────────────────────────────────────────
    @ReactMethod
    fun startGlobalEqualizer(promise: Promise) {
        try {
            globalEqualizer?.release(); globalEqualizer = null
            requestFocus()
            globalEqualizer = Equalizer(0, 0)
            globalEqualizer?.enabled = true
            promise.resolve(true)
        } catch (e: Exception) {
            promise.resolve(false) // No bloquear la UI si falla
        }
    }

    @ReactMethod
    fun stopGlobalEqualizer(promise: Promise) {
        try { globalEqualizer?.enabled = false; globalEqualizer?.release() } catch (e: Exception) {}
        globalEqualizer = null
        abandonFocus()
        promise.resolve(true)
    }

    @ReactMethod
    fun applyGlobalConfig(gains: ReadableArray, promise: Promise) {
        val eq = globalEqualizer
        if (eq == null) { promise.resolve(false); return }
        try {
            val n = eq.numberOfBands.toInt()
            for (i in 0 until n) {
                val g = if (i < gains.size()) gains.getDouble(i).toFloat() else 0f
                eq.setBandLevel(i.toShort(), (g * 100).toInt().toShort())
            }
            promise.resolve(true)
        } catch (e: Exception) { promise.resolve(false) }
    }

    // ─── Ecualizador Ambiental — Opción A (Micrófono → DSP → Auricular) ────────
    @Volatile private var isTestingTone = false

    @ReactMethod
    fun startAmbientEqualizer(leftGains: ReadableArray, rightGains: ReadableArray, promise: Promise) {
        stopAmbientInternal()
        requestFocus()

        for (i in 0 until 11) {
            ambientLeftGains[i]  = if (i < leftGains.size())  leftGains.getDouble(i)  else 0.0
            ambientRightGains[i] = if (i < rightGains.size()) rightGains.getDouble(i) else 0.0
        }

        val inMinBuf = AudioRecord.getMinBufferSize(
            SAMPLE_RATE, AudioFormat.CHANNEL_IN_MONO, AudioFormat.ENCODING_PCM_16BIT)
        val inBufSize  = maxOf(inMinBuf, 2048) * 2

        val outMinBuf  = AudioTrack.getMinBufferSize(
            SAMPLE_RATE, AudioFormat.CHANNEL_OUT_STEREO, AudioFormat.ENCODING_PCM_16BIT)
        val outBufSize = maxOf(outMinBuf, inBufSize * 2)

        try {
            ambientRecord = AudioRecord(
                MediaRecorder.AudioSource.MIC, // Volvemos a MIC estándar (sin filtros agresivos de voz)
                SAMPLE_RATE,
                AudioFormat.CHANNEL_IN_MONO, AudioFormat.ENCODING_PCM_16BIT, inBufSize
            )

            ambientTrack = buildAudioTrack(outBufSize, AudioAttributes.CONTENT_TYPE_MUSIC)
        } catch (e: Exception) {
            promise.reject("AMBIENT_ERROR", "Error inicializando audio ambiente: ${e.message}")
            return
        }

        isAmbientRunning = true
        promise.resolve(true)

        Thread {
            // Q de 0.707 (Butterworth) para que no resuene tanto ni haga siseo
            val filtersL = CLINICAL_FREQUENCIES.map { BiquadFilter(it).apply { setGain(0.0, 0.707) } }
            val filtersR = CLINICAL_FREQUENCIES.map { BiquadFilter(it).apply { setGain(0.0, 0.707) } }

            val inputBuf  = ShortArray(inBufSize / 2)
            val outputBuf = ShortArray(inputBuf.size * 2) // stereo interleaved

            try {
                ambientRecord?.startRecording()
                ambientTrack?.play()

                while (isAmbientRunning) {
                    val read = ambientRecord?.read(inputBuf, 0, inputBuf.size) ?: break
                    if (read <= 0) continue

                    if (isTestingTone) {
                        outputBuf.fill(0)
                        ambientTrack?.write(outputBuf, 0, read * 2)
                        continue
                    }

                    filtersL.forEachIndexed { i, f -> f.setGain(ambientLeftGains[i], 0.707) }
                    filtersR.forEachIndexed { i, f -> f.setGain(ambientRightGains[i], 0.707) }

                    for (i in 0 until read) {
                        // Multiplicamos x3.0 para darle un gran boost al micrófono
                        val sample = (inputBuf[i].toDouble() / Short.MAX_VALUE) * 3.0

                        var outL = sample
                        for (f in filtersL) outL = f.process(outL)

                        var outR = sample
                        for (f in filtersR) outR = f.process(outR)

                        outputBuf[i * 2]     = (outL * Short.MAX_VALUE).toInt()
                            .coerceIn(Short.MIN_VALUE.toInt(), Short.MAX_VALUE.toInt()).toShort()
                        outputBuf[i * 2 + 1] = (outR * Short.MAX_VALUE).toInt()
                            .coerceIn(Short.MIN_VALUE.toInt(), Short.MAX_VALUE.toInt()).toShort()
                    }

                    ambientTrack?.write(outputBuf, 0, read * 2)
                }
            } catch (e: Exception) { /* loop terminado */ }
            finally {
                try { ambientRecord?.stop(); ambientRecord?.release() } catch (e: Exception) {}
                try { ambientTrack?.stop();  ambientTrack?.release()  } catch (e: Exception) {}
                ambientRecord = null; ambientTrack = null
            }
        }.start()
    }

    @ReactMethod
    fun stopAmbientEqualizer(promise: Promise) {
        stopAmbientInternal()
        abandonFocus()
        promise.resolve(true)
    }

    @ReactMethod
    fun updateAmbientConfig(leftGains: ReadableArray, rightGains: ReadableArray, promise: Promise) {
        for (i in 0 until 11) {
            ambientLeftGains[i]  = if (i < leftGains.size())  leftGains.getDouble(i)  else 0.0
            ambientRightGains[i] = if (i < rightGains.size()) rightGains.getDouble(i) else 0.0
        }
        promise.resolve(true)
    }

    private fun stopAmbientInternal() {
        isAmbientRunning = false
        // El hilo se detiene cuando isAmbientRunning == false
        Thread.sleep(80) // Dar tiempo al loop para detenerse
    }

    // ─── Tonos de Autoexamen ───────────────────────────────────────────────────
    @ReactMethod
    fun playTestTone(frequency: Double, ear: String, gainDb: Double, promise: Promise) {
        stopTestToneInternal()
        requestFocus()
        isTestingTone = true

        Thread {
            try {
                val bufSize = maxOf(
                    AudioTrack.getMinBufferSize(
                        SAMPLE_RATE, AudioFormat.CHANNEL_OUT_STEREO, AudioFormat.ENCODING_PCM_16BIT),
                    4096
                )

                testAudioTrack = buildAudioTrack(bufSize, AudioAttributes.CONTENT_TYPE_SONIFICATION)
                testAudioTrack?.play()

                promise.resolve(true)

                val vol = Math.pow(10.0, gainDb / 20.0).toFloat().coerceIn(0f, 1f)
                val chunkPairs = bufSize / 4 // cantidad de frames stereo por chunk
                val chunk      = ShortArray(chunkPairs * 2)
                var frame      = 0L
                val maxFrames  = SAMPLE_RATE.toLong() * 8

                while (frame < maxFrames) {
                    val track = testAudioTrack ?: break
                    if (track.playState != AudioTrack.PLAYSTATE_PLAYING) break

                    for (i in 0 until chunkPairs) {
                        val sample = (sin(2 * PI * (frame + i) * frequency / SAMPLE_RATE) * Short.MAX_VALUE * vol)
                            .toInt().coerceIn(Short.MIN_VALUE.toInt(), Short.MAX_VALUE.toInt()).toShort()
                        chunk[i * 2]     = if (ear == "left"  || ear == "both") sample else 0
                        chunk[i * 2 + 1] = if (ear == "right" || ear == "both") sample else 0
                    }

                    track.write(chunk, 0, chunk.size)
                    frame += chunkPairs
                }
            } catch (e: Exception) { /* silenciar */ }
        }.start()
    }

    @ReactMethod
    fun stopTestTone(promise: Promise) {
        stopTestToneInternal()
        promise.resolve(true)
    }

    private fun stopTestToneInternal() {
        isTestingTone = false
        try { testAudioTrack?.stop(); testAudioTrack?.release() } catch (e: Exception) {}
        testAudioTrack = null
    }

    // ─── Helpers ───────────────────────────────────────────────────────────────
    private fun buildAudioTrack(bufSize: Int, contentType: Int): AudioTrack {
        return if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
            AudioTrack.Builder()
                .setAudioAttributes(
                    AudioAttributes.Builder()
                        .setUsage(AudioAttributes.USAGE_MEDIA)
                        .setContentType(contentType)
                        .build()
                )
                .setAudioFormat(
                    AudioFormat.Builder()
                        .setSampleRate(SAMPLE_RATE)
                        .setEncoding(AudioFormat.ENCODING_PCM_16BIT)
                        .setChannelMask(AudioFormat.CHANNEL_OUT_STEREO)
                        .build()
                )
                .setBufferSizeInBytes(bufSize)
                .setTransferMode(AudioTrack.MODE_STREAM)
                .build()
        } else {
            @Suppress("DEPRECATION")
            AudioTrack(AudioManager.STREAM_MUSIC, SAMPLE_RATE,
                AudioFormat.CHANNEL_OUT_STEREO, AudioFormat.ENCODING_PCM_16BIT,
                bufSize, AudioTrack.MODE_STREAM)
        }
    }
}
