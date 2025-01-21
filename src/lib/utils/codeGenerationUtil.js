import { savedGuestName } from "$lib/stores/context-specific/multiplayerStore";

export function generateRandomCode(length) {
    const characters = "abcdefghijklmnopqrstuvwxyz0123456789";
    let code = '';
    for (let i = 0; i < length; i++) {
        const randomIndex = Math.floor(Math.random() * characters.length);
        code += characters.charAt(randomIndex);
    }
    return code;
}

export function generateFunnyGuestName() {
    let animals = ["Giraffe", "Ape", "Sloth", "Penguin", "Kangaroo", "Panda", "Zebra", "Llama", "Hippo", "Parrot", "Cat", "Dog", "Slug", "Crow", "Elephant"];
    let randomAnimal = animals[Math.floor(Math.random() * animals.length)];
    savedGuestName.set("Guest" + randomAnimal);
}