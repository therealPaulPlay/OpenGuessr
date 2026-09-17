import { browser } from "$app/environment";

let Howl;

// Howler references browser globals at module eval, which crashes SSR in some JS runtimes
if (browser) import("howler").then((module) => (Howl = module.Howl));

const sounds = {};
let currentVariant = null;
let sfxVolume = 1.0;
let musicVolume = 1.0;

// Global mute --------------------------------------------------------------------------------------
export function setMuted(muted) {
    if (!browser) return;
    import("howler")
        .then((module) => module.Howler.mute(muted))
        .catch((error) => console.error("Couldn't set global mute: " + error));
}

// SFX ---------------------------------------------------------------------------------------------
export function setSoundsVolume(volume) {
    sfxVolume = Math.max(0, Math.min(volume, 1));
    localStorage.setItem("soundVolume", sfxVolume);
    try {
        for (let tag in sounds)
            if (Object.hasOwn(sounds, tag)) sounds[tag].volume(sfxVolume);
    } catch (error) {
        console.error("Couldn't set global volume for sounds: " + error);
    }
}

export function playSound(fileName, tag) {
    if (!Howl) return;
    try {
        const sound = new Howl({
            src: [`/sounds/${fileName}.ogg`],
            volume: sfxVolume
        });

        if (sfxVolume > 0) sound.play();
        sounds[tag] = sound;
    } catch (error) {
        console.error("Error playing sound: " + error);
    }
}

export function stopSound(tag) {
    try {
        if (sounds[tag]) {
            sounds[tag].stop();
            delete sounds[tag];
        }
    } catch (error) {
        console.error("Couldn't stop sound: " + error);
    }
}

// Music ---------------------------------------------------------------------------------------
let musicTrack = null;
let currentVolumeFactor = 1;
const fadeTime = 1500;

export function setMusicVolume(volume) {
    musicVolume = Math.max(0, Math.min(volume, 1));
    localStorage.setItem("musicVolume", musicVolume);

    if (musicTrack) {
        musicTrack.volume(musicVolume * currentVolumeFactor);

        if (musicVolume === 0) musicTrack.pause();
        else if (!musicTrack.playing()) musicTrack.play();
    }
}

export function playMusic(variant, volumeFactor = 1) {
    if (!Howl) return;
    try {
        currentVolumeFactor = volumeFactor;

        if (variant === currentVariant) {
            if (musicTrack) musicTrack.fade(musicTrack.volume(), musicVolume * volumeFactor, fadeTime)
            return;
        }

        // Create new track
        const track = new Howl({
            src: [`/music/music1_${variant}.ogg`],
            loop: true,
            volume: 0,
            onload: function () {
                if (musicVolume > 0) {
                    this.play();
                    this.fade(0, musicVolume * volumeFactor, fadeTime);
                }
            }
        });

        // Fade out old track
        const oldTrack = musicTrack;
        if (oldTrack) {
            oldTrack.fade(oldTrack.volume(), 0, fadeTime);
            setTimeout(() => oldTrack.stop(), fadeTime + 50);
        }

        // Update references
        currentVariant = variant;
        musicTrack = track;
    } catch (error) {
        console.error("Error playing music:", error);
    }
}