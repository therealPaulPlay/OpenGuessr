// Object to keep track of sounds by tag
const sounds = {};

// Global volume variable, default is 1 (max volume)
let globalVolume = 1.0;

// Function to set the global volume
export function setSoundsVolume(volume) {
    globalVolume = Math.max(0, Math.min(volume, 1)); // Ensure the volume is between 0 and 1
    localStorage.setItem("soundVolume", globalVolume);
    // Update the volume for all currently playing sounds
    try {
        for (let tag in sounds) {
            if (sounds.hasOwnProperty(tag)) {
                sounds[tag].volume = globalVolume * 0.5;
            }
        }
    } catch (error) {
        console.error("Couldn't set global volume for sounds: " + error);
    }
}

// Function to play a sound and assign it a tag
export function playSound(fileName, tag) {
    try {
        let sound = new Audio("/sounds/" + fileName + ".ogg");
        sound.volume = globalVolume * 0.5; // Set the sound volume to the global volume
        sound.play();
        sounds[tag] = sound;
    } catch (error) {
        console.error("Error playing sound: " + error);
    }
}

// Function to stop a sound by tag
export function stopSound(tag) {
    try {
        if (sounds[tag]) {
            sounds[tag].pause();
            sounds[tag].currentTime = 0; // Reset the sound
            delete sounds[tag];
        }
    } catch (error) {
        console.error("Couldn't stop sound: " + error);
    }
}