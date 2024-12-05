// Initialize keywords and excluded titles arrays
let keywords = [];
let excludedTitles = ["L'Agenda", "Mégaphone"]; // Titres exclus par défaut
let modelPrograms = []; // To store the loaded model programs
let differences = []; // Global variable to store the differences

// Function to add a new keyword field
function addKeywordField() {
    const container = document.getElementById("keywordsContainer");
    const index = keywords.length;

    // Create a new div for the keyword input
    const keywordDiv = document.createElement("div");
    keywordDiv.classList.add("keyword-field");
    keywordDiv.id = `keyword-${index}`;

    // Create input element for the keyword
    const keywordInput = document.createElement("input");
    keywordInput.type = "text";
    keywordInput.placeholder = "Entrez un mot-clé";
    keywordInput.oninput = () => updateKeyword(index, keywordInput.value);

    // Create a delete button
    const deleteButton = document.createElement("button");
    deleteButton.textContent = "Supprimer";
    deleteButton.onclick = () => deleteKeyword(index);

    // Append input and button to the div
    keywordDiv.appendChild(keywordInput);
    keywordDiv.appendChild(deleteButton);

    // Append the div to the container
    container.appendChild(keywordDiv);

    // Add an empty keyword to the array
    keywords.push("");
}

// Function to update a keyword
function updateKeyword(index, value) {
    keywords[index] = value.trim();
}

// Function to delete a keyword
function deleteKeyword(index) {
    keywords.splice(index, 1);  // Remove the keyword from the array

    // Remove the keyword input div from the DOM
    const keywordDiv = document.getElementById(`keyword-${index}`);
    keywordDiv.remove();
}

// Function to add a new excluded title field with optional default value
function addExcludedTitleField(title = "") {
    const container = document.getElementById("excludedTitlesContainer");
    const index = excludedTitles.length;

    // Create a new div for the excluded title input
    const excludedTitleDiv = document.createElement("div");
    excludedTitleDiv.classList.add("excluded-title-field");
    excludedTitleDiv.id = `excluded-title-${index}`;

    // Create input element for the excluded title
    const excludedTitleInput = document.createElement("input");
    excludedTitleInput.type = "text";
    excludedTitleInput.placeholder = "Entrez un titre à exclure";
    excludedTitleInput.value = title; // Set the default value if provided
    excludedTitleInput.oninput = () => updateExcludedTitle(index, excludedTitleInput.value);
    excludedTitleInput.disabled = true; // Disable the input field initially

    // Create a delete button
    const deleteButton = document.createElement("button");
    deleteButton.textContent = "Supprimer";
    deleteButton.onclick = () => deleteExcludedTitle(index);

    // Create an edit button
    const editButton = document.createElement("button");
    editButton.textContent = "Modifier";
    editButton.onclick = () => toggleEdit(excludedTitleInput, editButton);

    // Append input and buttons to the div
    excludedTitleDiv.appendChild(excludedTitleInput);
    excludedTitleDiv.appendChild(editButton); // Add the edit button
    excludedTitleDiv.appendChild(deleteButton); // Add the delete button

    // Append the div to the container
    container.appendChild(excludedTitleDiv);

    // Add the excluded title to the array
    excludedTitles.push(title);
}

// Function to toggle edit mode on the input field
function toggleEdit(input, button) {
    if (input.disabled) {
        input.disabled = false; // Enable the input field
        button.textContent = "Sauvegarder"; // Change button text to "Sauvegarder"
    } else {
        input.disabled = true; // Disable the input field
        button.textContent = "Modifier"; // Change button text back to "Modifier"
    }
}

// Function to update an excluded title
function updateExcludedTitle(index, value) {
    excludedTitles[index] = value.trim();
}

// Function to delete an excluded title
function deleteExcludedTitle(index) {
    excludedTitles.splice(index, 1);  // Remove the excluded title from the array

    // Remove the excluded title input div from the DOM
    const excludedTitleDiv = document.getElementById(`excluded-title-${index}`);
    excludedTitleDiv.remove();
}

// Function to initialize the excluded titles with default values
function initializeExcludedTitles() {
    excludedTitles.forEach(title => {
        addExcludedTitleField(title); // Add each default title
    });
}

// Initialize excluded titles on page load
document.addEventListener("DOMContentLoaded", () => {
    initializeExcludedTitles(); // Populate the default excluded titles on page load
});

// Function to reset all fields and previews
function resetAll() {
    // Reset keywords and excluded titles
    keywords = [];
    excludedTitles = [];
    document.getElementById("keywordsContainer").innerHTML = "";
    document.getElementById("excludedTitlesContainer").innerHTML = "";

    // Reset file inputs
    document.getElementById("modelFile").value = "";
    document.getElementById("weekFile").value = "";

    // Clear the preview
    document.getElementById("preview").innerHTML = "";
    const editableMail = document.getElementById("editableMail");
    if (editableMail) {
        editableMail.innerHTML = "";
    }

    // Remove uploaded class from file labels
    document.querySelectorAll('.file-upload-label').forEach(label => {
        label.classList.remove('uploaded');
    });
}

// Function to handle file upload and change label style
function handleFileUpload(event) {
    const fileInput = event.target;
    const label = document.querySelector(`label[for='${fileInput.id}']`);
    if (fileInput.files.length > 0) {
        label.classList.add('uploaded'); // Add the 'uploaded' class
    } else {
        label.classList.remove('uploaded'); // Remove the 'uploaded' class if no file
    }
}

// Event listeners for file upload inputs
document.getElementById("modelFile").addEventListener("change", handleFileUpload);
document.getElementById("weekFile").addEventListener("change", handleFileUpload);

// Function to read and parse XML files
function parseXML(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = function(event) {
            const parser = new DOMParser();
            const xmlDoc = parser.parseFromString(event.target.result, "text/xml");
            resolve(xmlDoc);
        };
        reader.onerror = function() {
            reject("Erreur lors de la lecture du fichier " + file.name);
        };
        reader.readAsText(file);
    });
}

// Function to extract the week number from the filename
function extractWeekNumber(filename) {
    // Look for the word "Sem" followed by digits
    const regex = /Sem\s*(\d+)/i; // Regular expression to match "Sem" followed by digits (with possible spaces)
    const match = filename.match(regex);
    return match ? match[1] : null; // Return the week number or null if not found
}

// Function to extract programs from XML
function extractPrograms(xml) {
    const programs = [];
    const days = xml.getElementsByTagName("Day");
    for (let day of days) {
        const dayName = day.getAttribute("day");
        const timeIn = day.getElementsByTagName("Heure-IN")[0].textContent;
        const timeOut = day.getElementsByTagName("Heure-OUT")[0].textContent;
        const title = day.getElementsByTagName("Titre-Emission")[0].textContent;
        programs.push({
            day: dayName,
            timeIn: timeIn,
            timeOut: timeOut,
            title: title
        });
    }
    return programs;
}

// Function to analyze the files and extract the week number
function analyzeFiles() {
    const modelFile = document.getElementById("modelFile").files[0];
    const weekFile = document.getElementById("weekFile").files[0];

    if (!modelFile) {
        alert("Veuillez sélectionner le fichier modèle.");
        return;
    }
    if (!weekFile) {
        alert("Veuillez sélectionner le fichier de la semaine pour l'analyse.");
        return;
    }

    const weekNumber = extractWeekNumber(weekFile.name); // Extract the week number from the filename

    Promise.all([parseXML(modelFile).then(extractPrograms), parseXML(weekFile).then(extractPrograms)])
        .then(programs => {
            const [modelPrograms, weekPrograms] = programs;

            // Compare week programs with model programs and store differences globally
            differences = comparePrograms(modelPrograms, weekPrograms, keywords, excludedTitles);

            // Display the preview for the first email
            displayPreview(differences);

            // Display the second email for the company with the week number
            displayCompanyEmailPreview(differences, weekNumber);
        })
        .catch(error => {
            console.error("Erreur lors de l'analyse des fichiers :", error);
        });
}

// Function to compare the model and week programs with flexibility on start and end time and exclusion
function comparePrograms(modelPrograms, weekPrograms, keywords, excludedTitles) {
    const differences = [];
    const durationThreshold = 5 * 60; // 5 minutes in seconds for end time
    const startThreshold = 2 * 60; // 2 minutes in seconds for start time

    // Convert time to seconds for easier comparison
    function timeToSeconds(time) {
        const parts = time.split(':');
        return parseInt(parts[0]) * 3600 + parseInt(parts[1]) * 60 + parseInt(parts[2]);
    }

    // Compare each week program to the model
    for (let weekProgram of weekPrograms) {
        // Check if the title is in the excluded titles list
        if (excludedTitles.some(title => title.toLowerCase() === weekProgram.title.toLowerCase().trim())) {
            continue; // Skip this program if it should be excluded
        }

        // Find a match in the model based on day, start time (with threshold), and title only
        const match = modelPrograms.find(modelProgram => 
            modelProgram.day === weekProgram.day &&
            Math.abs(timeToSeconds(modelProgram.timeIn) - timeToSeconds(weekProgram.timeIn)) <= startThreshold &&
            modelProgram.title === weekProgram.title &&
            Math.abs(timeToSeconds(modelProgram.timeOut) - timeToSeconds(weekProgram.timeOut)) <= durationThreshold
        );

        // If no match is found in the model, it's a new or modified program
        if (!match) {
            const keywordMatch = keywords.some(keyword => weekProgram.title.toLowerCase().includes(keyword.toLowerCase()));
            differences.push({
                ...weekProgram,
                keywordMatch: keywordMatch ? "Mots-Clés trouvés" : "Programme différent"
            });
        }
    }

    return differences;
}

// Function to group differences by title and order by time
function groupAndSortByTitle(differences) {
    // Group by title
    const grouped = differences.reduce((acc, program) => {
        if (!acc[program.title]) {
            acc[program.title] = []; // Create a new array for each title
        }
        acc[program.title].push(program); // Add the program to the relevant title group
        return acc;
    }, {});

    // Sort each group by day and time
    Object.keys(grouped).forEach(title => {
        grouped[title].sort((a, b) => {
            const daysOfWeek = ['lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi', 'dimanche'];
            // Compare by day index and then by time
            if (daysOfWeek.indexOf(a.day.toLowerCase()) !== daysOfWeek.indexOf(b.day.toLowerCase())) {
                return daysOfWeek.indexOf(a.day.toLowerCase()) - daysOfWeek.indexOf(b.day.toLowerCase());
            }
            return a.timeIn.localeCompare(b.timeIn);
        });
    });

    return grouped;
}

// Function to generate the formatted email preview with the new structure and link
function generateEmailPreview(differences) {
    let emailContent = "<p><b>Spécificités de la semaine :</b></p>";

    // Group differences by title and order by time
    const groupedPrograms = groupAndSortByTitle(differences);

    // Construct the email content
    emailContent += "<ul>";
    for (let title in groupedPrograms) {
        emailContent += `<br><li><b>${title}</b><ul>`; // Added <br> before each new title
        for (let program of groupedPrograms[title]) {
            emailContent += `<li>${program.day} de ${program.timeIn} à ${program.timeOut}</li>`;
        }
        emailContent += "</ul></li>"; // Close the inner <ul> and <li> for each title
    }
    emailContent += "</ul>"; // Close the main <ul>

    return emailContent;
}

// Function to generate the second formatted email preview for the entire company and providers
function generateCompanyEmailPreview(differences, weekNumber) {
    let emailContent = "<p><b>Spécificités de la semaine :</b></p>";

    // Group differences by title and order by time
    const groupedPrograms = groupAndSortByTitle(differences);

    // Construct the email content
    emailContent += "<ul>";
    for (let title in groupedPrograms) {
        emailContent += `<br><li><b>${title}</b><ul>`; // Added <br> before each new title
        for (let program of groupedPrograms[title]) {
            emailContent += `<li>${program.day} de ${program.timeIn} à ${program.timeOut}</li>`;
        }
        emailContent += "</ul></li>"; // Close the inner <ul> and <li> for each title
    }
    emailContent += "</ul>"; // Close the main <ul>

    

    return emailContent;
}

// Function to display the preview of the email and fill the editable area
function displayPreview(differences) {
    const emailContent = generateEmailPreview(differences);
    // Inject the content into the editable area
    const editableMail = document.getElementById("editableMail");
    if (editableMail) {
        editableMail.innerHTML = emailContent;
    } else {
        console.error("L'élément 'editableMail' n'existe pas dans le DOM.");
    }

    // Also display in the preview section
    const preview = document.getElementById("preview");
    if (preview) {
        preview.innerHTML = "<h3>Prévisualisation du Mail :</h3>";
        preview.innerHTML += emailContent;
    }
}

// Function to copy the content of the editable area to clipboard
function copyToClipboard(elementId) {
    const editableMail = document.getElementById(elementId);
    if (editableMail) {
        const range = document.createRange();
        range.selectNodeContents(editableMail);
        const selection = window.getSelection();
        selection.removeAllRanges();
        selection.addRange(range);
        try {
            document.execCommand("copy");
            alert("Contenu copié dans le presse-papiers !");
        } catch (err) {
            console.error("Échec de la copie : ", err);
        }
        selection.removeAllRanges(); // Clear the selection after copying
    }
}

// Function to reset all fields and previews
function resetAll() {
    // Reset keywords and excluded titles arrays
    keywords = [];
    excludedTitles = [];
    
    // Clear the keyword and excluded title containers
    document.getElementById("keywordsContainer").innerHTML = "";
    document.getElementById("excludedTitlesContainer").innerHTML = "";

    // Reset file inputs
    document.getElementById("modelFile").value = "";
    document.getElementById("weekFile").value = "";

    // Clear the preview and editable mail
    const editableMail = document.getElementById("editableMail");
    if (editableMail) {
        editableMail.innerHTML = "";
    }
    
    const preview = document.getElementById("preview");
    if (preview) {
        preview.innerHTML = "";
    }

    // Remove the 'uploaded' class from the file labels (if any)
    document.querySelectorAll('.file-upload-label').forEach(label => {
        label.classList.remove('uploaded');
    });

    // Clear any global variables like differences if needed
    differences = [];
}

// Event listener for the "Analyze" button
document.addEventListener("DOMContentLoaded", () => {
    // Event listeners for file upload inputs
    document.getElementById("modelFile").addEventListener("change", handleFileUpload);
    document.getElementById("weekFile").addEventListener("change", handleFileUpload);
});

// THEME CLAIR/FONCE
const themeToggle = document.getElementById('theme-toggle');
const body = document.body;

// Charger le thème depuis le stockage local
document.addEventListener('DOMContentLoaded', () => {
    const savedTheme = localStorage.getItem('theme') || 'light';
    console.log('Thème chargé depuis le stockage local :', savedTheme);

    // Appliquer le thème sauvegardé
    body.setAttribute('data-theme', savedTheme);
    console.log('Attribut data-theme défini sur :', savedTheme);

    // Appliquer la classe active si le thème est sombre
    const isDark = savedTheme === 'dark';
    themeToggle.classList.toggle('active', isDark);
    console.log('Classe "active" appliquée au basculeur :', isDark);
});

// Bascule entre les thèmes
themeToggle.addEventListener('click', () => {
    const isDark = body.getAttribute('data-theme') === 'dark';
    const newTheme = isDark ? 'light' : 'dark';
    console.log('Thème actuel :', isDark ? 'dark' : 'light');
    console.log('Nouveau thème à appliquer :', newTheme);

    // Appliquer le nouveau thème
    body.setAttribute('data-theme', newTheme);
    console.log('Attribut data-theme mis à jour sur :', newTheme);

    // Mettre à jour la classe active
    themeToggle.classList.toggle('active', newTheme === 'dark');
    console.log('Classe "active" mise à jour sur le basculeur :', newTheme === 'dark');

    // Sauvegarder le thème dans le stockage local
    localStorage.setItem('theme', newTheme);
    console.log('Thème sauvegardé dans le stockage local :', newTheme);
});
