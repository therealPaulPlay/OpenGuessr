import { Howl, Howler } from 'howler';

const sounds = {};
let currentMusic = null;
let currentVariant = null;
let sfxVolume = 1.0;
let musicVolume = 1.0;

// SFX ---------------------------------------------------------------------------------------------
export function setSoundsVolume(volume) {
    sfxVolume = Math.max(0, Math.min(volume, 1));
    localStorage.setItem("soundVolume", sfxVolume);
    try {
        for (let tag in sounds)
            if (sounds.hasOwnProperty(tag)) sounds[tag].volume(sfxVolume);
    } catch (error) {
        console.error("Couldn't set global volume for sounds: " + error);
    }
}

export function playSound(fileName, tag) {
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

export function setMusicVolume(volume) {
    musicVolume = Math.max(0, Math.min(volume, 1));
    localStorage.setItem("musicVolume", musicVolume);

    if (musicTrack) {
        const vol = currentVariant === "chill" ? musicVolume * 0.35 : musicVolume;
        musicTrack.volume(vol);

        if (musicVolume === 0) musicTrack.pause();
        else if (!musicTrack.playing()) musicTrack.play();
    }
}

export function playMusic(variant) {
    if (variant === currentVariant) return;

    try {
        const targetVol = variant === "chill" ? musicVolume * 0.35 : musicVolume;

        // Get current position if we have a track playing
        let position = 0;
        if (musicTrack && musicTrack.playing()) position = musicTrack.seek();

        // Save reference to old track
        const oldTrack = musicTrack;
        const fadeTime = 1000; // 1 second fade

        // Create new track - intentionally NOT starting at 0 volume
        const track = new Howl({
            src: [`/music/music1_${variant}.ogg`],
            html5: true,
            loop: true,
            preload: 'metadata',  // Only preload metadata, not the entire file
            volume: 0.01,
            onload: function () {
                if (position > 0) this.seek(position); // Set position if available

                // Only play if volume allows
                if (musicVolume > 0) {
                    setTimeout(() => {
                        this.play();
                        setTimeout(() => { track.fade(0, targetVol, fadeTime) }, 100);
                    }, 100);

                    // If we have an old track, fade it out
                    if (oldTrack) {
                        oldTrack.fade(oldTrack.volume(), 0, fadeTime); // Fade volume

                        // Stop old track after fade
                        setTimeout(() => {
                            oldTrack.stop();
                        }, fadeTime + 250);
                    }
                }
            }
        });

        // Update references immediately
        currentVariant = variant;
        musicTrack = track;

    } catch (error) {
        console.error("Error playing music:", error);
    }
}