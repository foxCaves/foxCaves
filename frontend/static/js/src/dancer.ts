'use strict';
/*
 * dancer - v0.4.0 - 2014-02-01
 * https://github.com/jsantell/dancer.js
 * Copyright (c) 2014 Jordan Santell
 * Licensed MIT
 */
namespace dancer {

	interface KickOptions {
		frequency?: number | [number, number];
		threshold?: number;
		decay?: number;
		onKick?: any;
		offKick?: any;
	}

	interface AudioSourceThing {
		source: string;
		codecs: string[];
	}

	interface Section {
		condition(): boolean;
		callback(): void;
		called?: boolean;
	}

	export class Dancer {
		static version = '0.3.2';
		static adapters = {};

		static options = {};


		static setOptions(o: object) {
			Object.assign(this.options, o);
		};

		static canPlay(type: string) {
			return ['probably', 'maybe'].includes(audioEl.canPlayType(CODECS[type.toLowerCase()]!));
		}


		static _makeSupportedPath({ source, codecs }: AudioSourceThing) {
			if (!codecs) { return source; }

			for (const codec of codecs) {
				if (Dancer.canPlay(codec)) {
					return source + '.' + codec;
				}
			}

			return source;
		}

		static _getMP3SrcFromAudio(audioEl: HTMLAudioElement): string | null {
			if (audioEl.src) { return audioEl.src; }
			for(const source of Array.from(audioEl.getElementsByTagName('source'))) {
				if (source.type.toLowerCase().includes('audio/mpeg')) {
					return source.src;
				}
			}
			return null;
		}
		

		private audioAdapter = new WebAudioAdapter(this);
		private events = new Map<string, (() => void)[]>();
		private sections: Section[] = [];
		private source: HTMLAudioElement | undefined;

		constructor() {
			this.bind('update', () => this.update());
		}

		private update() {
			for(const sec of this.sections) {
				if (sec.condition()) {
					sec.callback();
				}
			}
		}

		load(source: AudioSourceThing | HTMLAudioElement) {
			// Loading an Audio element
			if (source instanceof HTMLAudioElement) {
				this.source = source;

				// Loading an object with src, [codecs]
			} else {
				this.source = new Audio();
				this.source.src = Dancer._makeSupportedPath(source);
			}

			this.audioAdapter.load(this.source);
			return this;
		}
		/* Controls */
		play() {
			this.audioAdapter.play();
			return this;
		}
		pause() {
			this.audioAdapter.pause();
			return this;
		}
		setVolume(volume: number) {
			this.audioAdapter.setVolume(volume);
			return this;
		}
		/* Actions */
		createKick(options: KickOptions): Kick {
			return new Kick(this, options);
		}
		bind(name: string, callback: () => void): this {
			if (!this.events.has(name)) {
				this.events.set(name, [])
			}
			this.events.get(name)!.push(callback);
			return this;
		}
		unbind(name: string): this {
			this.events.delete(name); // TODO: This shouldn't wipe all listeners??
			return this;
		}
		trigger(name: string) {
			for(const listener of this.events.get(name) ?? []) {
				listener();
			}
			return this;
		}
		/* Getters */
		getVolume(): number {
			return this.audioAdapter.getVolume();
		}
		getProgress(): number {
			return this.audioAdapter.getProgress();
		}
		getTime(): number {
			return this.audioAdapter.getTime();
		}
		// Returns the magnitude of a frequency or average over a range of frequencies
		getFrequency(freq: number, endFreq?: number): number {
			let sum = 0;
			if (endFreq !== undefined) {
				for (let i = freq; i <= endFreq; i++) {
					sum += this.getSpectrum()[i]!;
				}
				return sum / (endFreq - freq + 1);
			}
			return this.getSpectrum()[freq]!;
		}
		getWaveform() {
			return this.audioAdapter.getWaveform();
		}
		getSpectrum() {
			return this.audioAdapter.getSpectrum();
		}
		isLoaded() {
			return this.audioAdapter.isLoaded;
		}
		isPlaying() {
			return this.audioAdapter.isPlaying;
		}
		/* Sections */
		after(time: number, callback: () => void) {
			const _this = this;
			this.sections.push({
				condition() {
					return _this.getTime() > time;
				},
				callback
			});
			return this;
		}
		before(time: number, callback: () => void) {
			const _this = this;
			this.sections.push({
				condition() {
					return _this.getTime() < time;
				},
				callback
			});
			return this;
		}
		between(startTime: number, endTime: number, callback: () => void) {
			const _this = this;
			this.sections.push({
				condition() {
					return _this.getTime() > startTime && _this.getTime() < endTime;
				},
				callback,
			});
			return this;
		}
		onceAt(time: number, callback: () => void) {
			const _this = this;
			let called = false
			this.sections.push({
				condition() {
					return !called && _this.getTime() > time;
				},
				callback() {
					callback();
					called = true;
				},
			});
			return this;
		}
	}


	const CODECS: {
		[key: string]: string;
	} = {
		'mp3': 'audio/mpeg;',
		'flac': 'audio/flac;',
		'ogg': 'audio/ogg; codecs="vorbis"',
		'wav': 'audio/wav; codecs="1"',
		'aac': 'audio/mp4; codecs="mp4a.40.2"'
	};
	const audioEl = document.createElement('audio');



	class Kick {
		private isOn = false;
		private frequency: number | [number, number] = [0, 10];
		private threshold: number = 0.3;
		private decay: number = 0.02;
		private currentThreshold: number;
		onKick: any;
		offKick: any;

		constructor(private dancer: Dancer, o: KickOptions = {}) {
			Object.assign(this, o);

			this.isOn = false;
			this.currentThreshold = this.threshold;

			this.dancer.bind('update', () => {
				this.onUpdate();
			});
		}
		on() {
			this.isOn = true;
			return this;
		}
		off() {
			this.isOn = false;
			return this;
		}
		set(o: KickOptions) {
			Object.assign(this, o);
		}
		onUpdate() {
			if (!this.isOn) { return; }
			let magnitude = this.maxAmplitude(this.frequency);
			if (magnitude >= this.currentThreshold &&
				magnitude >= this.threshold) {
				this.currentThreshold = magnitude;
				this.onKick && this.onKick.call(this.dancer, magnitude);
			} else {
				this.offKick && this.offKick.call(this.dancer, magnitude);
				this.currentThreshold -= this.decay;
			}
		}
		maxAmplitude(frequency: number | [number, number]): number {
			let max = 0;
			const fft = this.dancer.getSpectrum();

			// Sloppy array check
			if (typeof frequency === 'number') {
				return frequency < fft.length ?
					fft[~~frequency]! :
					-1;
			}

			for (let i = frequency[0]!, l = frequency[1]; i <= l; i++) {
				if (fft[i]! > max) { max = fft[i]!; }
			}
			return max;
		}
	}

	const
		SAMPLE_SIZE = 2048,
		SAMPLE_RATE = 44100;

	class WebAudioAdapter {
		private audio = new Audio();
		private context = new AudioContext();
		public isLoaded = false; // TODO readonly
		private progress = 0;
		public isPlaying = false;
		private proc: ScriptProcessorNode | undefined;
		private gain: GainNode | undefined;
		private fft: FFT | undefined;
		private signal: Float32Array | undefined;
		private source: MediaElementAudioSourceNode | undefined;
		constructor(private readonly dancer: Dancer) {
			this.dancer = dancer;
		}
		connectContext() {
			this.source = this.context.createMediaElementSource(this.audio);
			this.source.connect(this.proc!);
			this.source.connect(this.gain!);
			this.gain!.connect(this.context.destination);
			this.proc!.connect(this.context.destination);

			this.isLoaded = true;
			this.progress = 1;
			this.dancer.trigger('loaded');
		}
		private assertLoaded(): void {
			if (!this.isLoaded) {
				throw new Error('not loaded');
			}
		}

		load(_source: HTMLAudioElement) {
			const _this = this;
			this.audio = _source;

			this.isLoaded = false;
			this.progress = 0;

			this.proc = this.context.createScriptProcessor(SAMPLE_SIZE / 2, 1, 1);

			this.proc.onaudioprocess = (e) => {
				this.update(e);
			};

			this.gain = this.context.createGain();

			this.fft = new FFT(SAMPLE_SIZE / 2, SAMPLE_RATE);
			this.signal = new Float32Array(SAMPLE_SIZE / 2);

			if (this.audio.readyState < 3) {
				this.audio.addEventListener('canplay', () => {
					this.connectContext();
				});
			} else {
				this.connectContext();
			}

			this.audio.addEventListener('progress', () => {
				if (this.audio.duration) {
					this.audio
					_this.progress = this.audio.seekable.end(0) / this.audio.duration;
				}
			});

			return this.audio;
		}
		play() {
			this.audio.play();
			this.isPlaying = true;
		}
		pause() {
			this.audio.pause();
			this.isPlaying = false;
		}
		setVolume(volume: number) {
			this.assertLoaded();
			this.gain!.gain.value = volume;
		}

		getVolume() {
			this.assertLoaded();
			return this.gain!.gain.value;
		}
		getProgress() {
			return this.progress;
		}
		getWaveform() {
			return this.signal;
		}
		getSpectrum(): Float32Array {
			this.assertLoaded();
			return this.fft!.spectrum!;
		}
		getTime() {
			return this.audio.currentTime;
		}
		update(e: AudioProcessingEvent) {
			if (!this.isPlaying || !this.isLoaded) {
				return;
			}

			const channels = e.inputBuffer.numberOfChannels;
			const buffers = new Array<Float32Array>(channels);
			const resolution = SAMPLE_SIZE / channels;

			for (let i = channels; i--;) {
				buffers[i] = e.inputBuffer.getChannelData(i);
			}

			for (let i = 0; i < resolution; i++) {
				let sum = 0;
				for(let k = 0;k < buffers.length;++k) {
					sum += buffers[k]![i]!;
				}
				this.signal![i] = sum / channels;
			}

			this.fft!.forward(this.signal!);
			this.dancer.trigger('update');
		}
	}


	/*
	*  DSP.js - a comprehensive digital signal processing  library for javascript
	*
	*  Created by Corban Brook <corbanbrook@gmail.com> on 2010-01-01.
	*  Copyright 2010 Corban Brook. All rights reserved.
	*
	*  Fourier Transform Module used by DFT, FFT, RFFT
	*/
	class FourierTransform {
		private readonly bandwidth: number;
		public readonly spectrum: Float32Array;
		protected readonly real: Float32Array;
		protected readonly imag: Float32Array;
		// private peakBand = 0;
		private peak = 0;
		constructor(protected bufferSize: number, protected sampleRate: number) {
			this.bufferSize = bufferSize;
			this.sampleRate = sampleRate;
			this.bandwidth = 2 / bufferSize * sampleRate / 2;

			this.imag = new Float32Array(bufferSize);
			this.spectrum = new Float32Array(bufferSize / 2);
			this.real = new Float32Array(bufferSize);
		}

		/**
		 * Calculates the *middle* frequency of an FFT band.
		 *
		 * @param {Number} index The index of the FFT band.
		 *
		 * @returns The middle frequency in Hz.
		 */
		getBandFrequency(index: number) {
			return this.bandwidth * index + this.bandwidth / 2;
		}

		calculateSpectrum() {
			const { spectrum, real, imag, bufferSize } = this;
			let rval = 0;
			let ival = 0;
			let mag = 0;
			const bSi = 2 / bufferSize;

			for (let i = 0, N = this.bufferSize / 2; i < N; i++) {
				rval = real[i]!;
				ival = imag[i]!;
				mag = bSi * Math.sqrt(rval * rval + ival * ival);

				if (mag > this.peak) {
					// this.peakBand = i;
					this.peak = mag;
				}

				spectrum[i] = mag;
			}
		}
	}

	/**
	 * FFT is a class for calculating the Discrete Fourier Transform of a signal
	 * with the Fast Fourier Transform algorithm.
	 *
	 * @param {Number} bufferSize The size of the sample buffer to be computed. Must be power of 2
	 * @param {Number} sampleRate The sampleRate of the buffer (eg. 44100)
	 *
	 * @constructor
	 */
	class FFT extends FourierTransform {
		private reverseTable: Uint32Array;
		private sinTable: Float32Array;
		private cosTable: Float32Array;
		constructor(bufferSize: number, sampleRate: number) {
			super(bufferSize, sampleRate);

			this.reverseTable = new Uint32Array(bufferSize);

			let limit = 1;
			let bit = bufferSize >> 1;

			while (limit < bufferSize) {
				for (let i = 0; i < limit; i++) {
					this.reverseTable[i + limit] = this.reverseTable[i]! + bit;
				}

				limit = limit << 1;
				bit = bit >> 1;
			}

			this.sinTable = new Float32Array(bufferSize);
			this.cosTable = new Float32Array(bufferSize);

			for (let i = 0; i < bufferSize; i++) {
				this.sinTable[i] = Math.sin(-Math.PI / i);
				this.cosTable[i] = Math.cos(-Math.PI / i);
			}
		}
		/**
		 * Performs a forward transform on the sample buffer.
		 * Converts a time domain signal to frequency domain spectra.
		 *
		 * @param {Array} buffer The sample buffer. Buffer Length must be power of 2
		 *
		 * @returns The frequency spectrum array
		 */
		forward(buffer: Float32Array) {
			// Locally scope variables for speed up
			const { real, imag, bufferSize, cosTable, sinTable, reverseTable } = this;

			const k = Math.floor(Math.log(bufferSize) / Math.LN2);

			if (Math.pow(2, k) !== bufferSize) { throw new Error("Invalid buffer size, must be a power of 2."); }
			if (bufferSize !== buffer.length) { throw new Error("Supplied buffer is not the same size as defined FFT. FFT Size: " + bufferSize + " Buffer Size: " + buffer.length); }


			for (let i = 0; i < bufferSize; i++) {
				real[i] = buffer[reverseTable[i]!]!;
				imag[i] = 0;
			}

			let halfSize = 1;
			while (halfSize < bufferSize) {
				//phaseShiftStepReal = Math.cos(-Math.PI/halfSize);
				//phaseShiftStepImag = Math.sin(-Math.PI/halfSize);
				const phaseShiftStepReal = cosTable[halfSize]!;
				const phaseShiftStepImag = sinTable[halfSize]!;

				let currentPhaseShiftReal = 1;
				let currentPhaseShiftImag = 0;

				for (let fftStep = 0; fftStep < halfSize; fftStep++) {
					let i = fftStep;

					while (i < bufferSize) {
						const off = i + halfSize;
						const tr = (currentPhaseShiftReal * real[off]!) - (currentPhaseShiftImag * imag[off]!);
						const ti = (currentPhaseShiftReal * imag[off]!) + (currentPhaseShiftImag * real[off]!);

						real[off] = real[i]! - tr;
						imag[off] = imag[i]! - ti;
						real[i] += tr;
						imag[i] += ti;

						i += halfSize << 1;
					}

					const tmpReal = currentPhaseShiftReal;
					currentPhaseShiftReal = (tmpReal * phaseShiftStepReal) - (currentPhaseShiftImag * phaseShiftStepImag);
					currentPhaseShiftImag = (tmpReal * phaseShiftStepImag) + (currentPhaseShiftImag * phaseShiftStepReal);
				}

				halfSize = halfSize << 1;
			}

			return this.calculateSpectrum();
		}
	}
}
