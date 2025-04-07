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

        // Manual fade function
        const manualFade = (sound, startVol, endVol, duration, onComplete) => {
            let currentVol = startVol;
            const fadeSteps = 20;
            const stepInterval = duration / fadeSteps;
            const volStep = (endVol - startVol) / fadeSteps;
            let steps = 0;

            const fadeInterval = setInterval(() => {
                steps++;
                currentVol += volStep;

                if (steps >= fadeSteps) {
                    currentVol = endVol;
                    clearInterval(fadeInterval);
                    if (onComplete) onComplete();
                }

                // Set the volume directly
                sound.volume(currentVol);
            }, stepInterval);

            return fadeInterval;
        };

        // Create new track
        const track = new Howl({
            src: [`/music/music1_${variant}.ogg`],
            html5: true,
            loop: true,
            preload: 'metadata',
            volume: 0,
            onload: function () {
                if (position > 0) this.seek(position);

                if (musicVolume > 0) {
                    this.play();
                    manualFade(this, 0., targetVol, fadeTime);

                    // Handle the old track
                    if (oldTrack) {
                        // Use manual fade for old track too
                        manualFade(oldTrack, oldTrack.volume(), 0, fadeTime, () => {
                            oldTrack.stop();
                        });
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