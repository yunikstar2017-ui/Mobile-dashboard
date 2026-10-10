const wordInput = document.getElementById("wordInput");
const searchButton = document.getElementById("searchButton");
const result = document.getElementById("result");


async function searchWord() {

    const word = wordInput.value.trim();

    if (word === "") {
        result.textContent = "Please enter a word.";
        return;
    }

    result.textContent = "Searching...";


    try {

        const response = await fetch(
            `https://freedictionaryapi.com/api/v1/entries/en/${encodeURIComponent(word)}`
        );


        if (!response.ok) {
            throw new Error("Word not found");
        }


        const data = await response.json();


        result.innerHTML = "";


        // Word
        const wordTitle = document.createElement("h2");
        wordTitle.textContent = data.word;

        result.appendChild(wordTitle);


        // Loop through dictionary entries
        data.entries.forEach(function(entry) {

            // Part of speech
            const partOfSpeech = document.createElement("h3");
            partOfSpeech.textContent = entry.partOfSpeech;

            result.appendChild(partOfSpeech);


            // Pronunciation
            if (entry.pronunciations.length > 0) {

                const pronunciation = document.createElement("p");

                pronunciation.textContent =
                    "Pronunciation: " +
                    entry.pronunciations[0].text;

                result.appendChild(pronunciation);
            }


            // Definitions
            entry.senses.forEach(function(sense, index) {

                const definition = document.createElement("div");

                definition.classList.add("definition");


                const definitionText = document.createElement("p");

                definitionText.textContent =
                    `${index + 1}. ${sense.definition}`;

                definition.appendChild(definitionText);


                // Example
                if (sense.examples.length > 0) {

                    const example = document.createElement("p");

                    example.classList.add("example");

                    example.textContent =
                        "Example: " + sense.examples[0];

                    definition.appendChild(example);
                }


                result.appendChild(definition);
            });


            // Synonyms
            if (entry.synonyms.length > 0) {

                const synonyms = document.createElement("p");

                synonyms.textContent =
                    "Synonyms: " + entry.synonyms.join(", ");

                result.appendChild(synonyms);
            }


            // Antonyms
            if (entry.antonyms.length > 0) {

                const antonyms = document.createElement("p");

                antonyms.textContent =
                    "Antonyms: " + entry.antonyms.join(", ");

                result.appendChild(antonyms);
            }

        });

    }


    catch (error) {

        result.textContent =
            "Sorry, we couldn't find that word.";

    }

}


searchButton.addEventListener("click", searchWord);


wordInput.addEventListener("keydown", function(event) {

    if (event.key === "Enter") {
        searchWord();
    }

});