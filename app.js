// Variables globales
let matchingRows = [];
let searchStringGlobal = "";
let searchColumnIndex = 4;
let timeColumns = [1, 2, 6];
let uniqueDates = new Set();

// Initialisation des événements de chargement de fichiers
document.addEventListener('DOMContentLoaded', function () {
    // Gestionnaire pour le fichier de recherche générale
    document.getElementById('uploadSearch').addEventListener('change', function () {
        const fileInput = document.getElementById('uploadSearch');
        if (fileInput.files.length > 0) {
            handleSearchFile(fileInput.files[0]);
        }
    })
    
    // Gestionnaire pour le fichier de programme Mag
    document.getElementById('uploadMag').addEventListener('change', function () {
        const fileInput = document.getElementById('uploadMag');
        if (fileInput.files.length > 0) {
            if (validateWeekNumber(fileInput.files[0].name)) {
                handleSecondFile(fileInput.files[0]);
            } else {
                alert("Le fichier sélectionné ne correspond pas à la semaine en cours.");
            }
        }
    });

    // Gestionnaire pour le fichier XML
    document.getElementById('uploadXml').addEventListener('change', function () {
        const fileInput = document.getElementById('uploadXml');
        if (fileInput.files.length > 0) {
            handleXmlFile(fileInput.files[0]);
        }
    });

    // Déclenche la recherche lors de l'appui sur la touche Entrée
    document.addEventListener('keydown', function (event) {
        if (event.key === 'Enter') {
            document.getElementById('searchBtn').click();
        }
    });

    // Déclenche la recherche lorsque le bouton est cliqué
    document.getElementById('searchBtn').addEventListener('click', function () {
        performSearch();
    });

    // Gestionnaire d'événements pour le bouton de téléchargement
    document.getElementById('downloadBtn').addEventListener('click', function () {
        generateExcel();
    });

    // Mise à jour des valeurs des curseurs avec le bouton "OK"
    document.getElementById('updateBtn').addEventListener('click', function () {
        reanalyzePrograms();
    });

    // Mise à jour des valeurs des curseurs
    const overlapSlider = document.getElementById('overlapDuration');
    const gapSlider = document.getElementById('gapDuration');
    overlapSlider.addEventListener('input', function () {
        document.getElementById('overlapValue').textContent = `${overlapSlider.value} min`;
    });
    gapSlider.addEventListener('input', function () {
        document.getElementById('gapValue').textContent = `${gapSlider.value} min`;
    });
});

// Fonction pour réanalyser les programmes avec les nouvelles valeurs des curseurs
function reanalyzePrograms() {
    if (loadedXmlDoc) {
        analyzedPrograms = parseXml(loadedXmlDoc); // Réanalyse basée sur les données en mémoire
        analyzePrograms(analyzedPrograms); // Mise à jour de l'affichage
    } else {
        alert("Veuillez charger un fichier XML pour l'analyse.");
    }
}   

// Fonction pour traiter le fichier XML
function handleXmlFile(file) {
    const reader = new FileReader();
    reader.onload = function (event) {
        const parser = new DOMParser();
        const xmlContent = event.target.result;

        // Sauvegarde dans le champ caché
        document.getElementById('xmlBackup').value = xmlContent;

        // Charger en mémoire
        loadedXmlDoc = parser.parseFromString(xmlContent, "application/xml");
        analyzedPrograms = parseXml(loadedXmlDoc);
        analyzePrograms(analyzedPrograms);
    };
    reader.readAsText(file);
}

// Recharger depuis le champ caché
document.addEventListener("DOMContentLoaded", () => {
    const xmlContent = document.getElementById('xmlBackup').value;
    if (xmlContent) {
        const parser = new DOMParser();
        loadedXmlDoc = parser.parseFromString(xmlContent, "application/xml");
        analyzedPrograms = parseXml(loadedXmlDoc);
        analyzePrograms(analyzedPrograms);
    }
});


// Variables globales
let loadedXmlDoc = null; // Contiendra le document XML chargé
let analyzedPrograms = []; // Contient les programmes analysés
const excludedPairs = [
    ["Le Journal", "Les Yeux dans les Yeux"],
    ["Les Yeux dans les Yeux", "Genève à Chaud"],
    ["L'Agenda", "Esprit Solidaire"]
];


// Exécuter les actions au chargement du DOM
document.addEventListener("DOMContentLoaded", () => {
    // Attacher l'événement au bouton d'ajout
    document.getElementById("addExclusionBtn").addEventListener("click", handleNewExclusion);

    // Rendre les paires d'exclusion au chargement
    renderExcludedPairs();

    // Charger le fichier XML sauvegardé (si disponible)
    const xmlContent = document.getElementById('xmlBackup')?.value;
    if (xmlContent) {
        const parser = new DOMParser();
        loadedXmlDoc = parser.parseFromString(xmlContent, "application/xml");
        analyzedPrograms = parseXml(loadedXmlDoc);
        updateAnalysis(); // Effectuer une première analyse
    }
});

// Gérer une nouvelle exclusion (titre ou paire)
function handleNewExclusion() {
    const input = document.getElementById('newExclusion').value.trim();

    if (input === "") {
        alert("Veuillez entrer une paire de titres à exclure.");
        return;
    }

    const titles = input.split(',').map(title => title.trim());
    if (titles.length !== 2 || titles[0] === "" || titles[1] === "") {
        alert("Veuillez entrer exactement deux titres séparés par une virgule.");
        return;
    }

    if (excludedPairs.some(pair => pair[0] === titles[0] && pair[1] === titles[1])) {
        alert("Cette paire de titres est déjà dans la liste des exclusions.");
        return;
    }

    excludedPairs.push(titles);
    renderExcludedPairs(); // Rafraîchir les interrupteurs
    document.getElementById('newExclusion').value = ""; // Effacer le champ de saisie
}

// Ajoute une paire de titres à exclure
function addExcludedPair(input) {
    const titles = input.split(',').map(title => title.trim());

    if (titles.length !== 2 || titles[0] === "" || titles[1] === "") {
        alert("Veuillez entrer exactement deux titres séparés par une virgule.");
        return;
    }

    if (excludedPairs.some(pair => pair[0] === titles[0] && pair[1] === titles[1])) {
        alert("Cette paire de titres est déjà dans la liste des exclusions.");
        return;
    }

    excludedPairs.push(titles);
    renderExcludedPairs();
}

// Ajouter les paires exclues
excludedPairs.forEach(([title1, title2]) => {
    const listItem = document.createElement("div");
    listItem.className = "excluded-item";

    const toggle = document.createElement("input");
    toggle.type = "checkbox";
    toggle.id = `toggle_${title1}_${title2}`;
    toggle.checked = true;

    const label = document.createElement("label");
    label.htmlFor = `toggle_${title1}_${title2}`;
    label.textContent = `${title1}, ${title2}`;

    listItem.appendChild(toggle);
    listItem.appendChild(label);

    // Utilisation correcte de `pairsList` au lieu de `titlesLi`
    const pairsList = document.getElementById("excludedTitlesList"); // Ajout pour récupérer la liste des paires
    pairsList.appendChild(listItem);
});


// Analyse le XML et extrait les données des programmes
function parseXml(xmlDoc) {
    const programs = [];
    const days = xmlDoc.getElementsByTagName("Day");

    for (let i = 0; i < days.length; i++) {
        const day = days[i];
        const dateElem = day.getElementsByTagName("Date")[0];
        const date = dateElem ? dateElem.textContent : "";
        const dayAttr = day.getAttribute("day");

        const startTimeElem = day.getElementsByTagName("Heure-IN")[0];
        const endTimeElem = day.getElementsByTagName("Heure-OUT")[0];
        const titleElem = day.getElementsByTagName("Titre-Emission")[0];

        if (startTimeElem && endTimeElem) {
            const startTime = new Date(`${date}T${startTimeElem.textContent}`);
            const endTime = new Date(`${date}T${endTimeElem.textContent}`);
            const duration = (endTime - startTime) / 60000; // Convertir en minutes
            const title = titleElem ? titleElem.textContent : "";

            programs.push({
                day: dayAttr,
                date: date,
                start_time: startTime,
                end_time: endTime,
                duration: duration,
                title: title,
                broadcast_type: day.getElementsByTagName("Type-de-Diffusion")[0]?.textContent || ""
            });
        }
    }

    return programs;
}

// Déclarer `programs` au niveau global
let programs = []; // Remplace ceci par le chargement de ta liste de programmes

// Fonction pour détecter les chevauchements et les trous entre les programmes
function analyzePrograms(programs, excludedPairs = []) {
    console.log("Liste des programmes analysés :", programs);
    console.log("Paires exclues :", excludedPairs);

    // Vérification des paramètres
    if (!Array.isArray(programs)) {
        console.error("Erreur : `programs` doit être un tableau.", { programs });
        return;
    }

    if (!Array.isArray(excludedPairs)) {
        console.warn("`excludedPairs` non défini ou incorrect, utilisation d'une liste vide par défaut.");
        excludedPairs = [];
    }

    const errors = [];
    const gaps = [];

    // Récupère les valeurs de chevauchement et de trou depuis l'interface avec une valeur par défaut
    const sensitivityDisplayOverlap = parseInt(document.getElementById('overlapDuration').value) || 0; // en minutes
    const minGapDuration = parseInt(document.getElementById('gapDuration').value) || 0; // en minutes

    // Trier les programmes par heure de début pour faciliter la détection des chevauchements et des trous
    programs.sort((a, b) => a.start_time - b.start_time);

    // Boucle pour comparer chaque programme avec le suivant
    for (let i = 0; i < programs.length - 1; i++) {
        const currentProgram = programs[i];
        const nextProgram = programs[i + 1];

        // Vérifier si les deux programmes sont dans une paire exclue
        const isExcludedPair = excludedPairs.some(pair =>
            (pair[0] === currentProgram.title && pair[1] === nextProgram.title) ||
            (pair[0] === nextProgram.title && pair[1] === currentProgram.title)
        );

        if (isExcludedPair) {
            continue; // Ignorer cette paire spécifique
        }

        // Vérifie si les deux programmes sont le même jour
        if (currentProgram.date === nextProgram.date) {
            const currentEndTime = currentProgram.end_time;
            const nextStartTime = nextProgram.start_time;

            // Détection des chevauchements
            if (currentEndTime > nextStartTime) {
                const overlapDuration = (currentEndTime - nextStartTime) / 60000; // Durée en minutes
                if (overlapDuration >= sensitivityDisplayOverlap) {
                    errors.push({
                        day: currentProgram.day,
                        currentTitle: currentProgram.title,
                        nextTitle: nextProgram.title,
                        duration: overlapDuration,
                        overlapTime: formatTime(currentEndTime) // Heure de fin du chevauchement
                    });
                }
            } 
            // Détection des trous
            else {
                const gapDuration = (nextStartTime - currentEndTime) / 60000; // Durée en minutes
                if (gapDuration >= minGapDuration) {
                    gaps.push({
                        day: currentProgram.day,
                        currentTitle: currentProgram.title,
                        nextTitle: nextProgram.title,
                        duration: gapDuration
                    });
                }
            }
        }
    }

    // Affiche les résultats
    displayXmlResults(errors, gaps);
}

// Affiche les paires d'exclusion avec des interrupteurs
// Ajouter dynamiquement une paire à la liste
function renderExcludedPairs() {
    const pairsList = document.getElementById("excludedTitlesList");
    pairsList.innerHTML = ""; // Réinitialiser le contenu actuel

    excludedPairs.forEach(([title1, title2]) => {
        const listItem = document.createElement("div");
        listItem.className = "excluded-item";

        // Toggle switch
        const toggle = document.createElement("input");
        toggle.type = "checkbox";
        toggle.id = `toggle_${title1}_${title2}`;
        toggle.checked = true;
        toggle.classList.add("toggle-switch");

        // Label pour la paire
        const label = document.createElement("label");
        label.htmlFor = `toggle_${title1}_${title2}`;
        label.textContent = `${title1}, ${title2}`;

        // Bouton de suppression
        const removeButton = document.createElement("span");
        removeButton.className = "remove-pair";
        removeButton.textContent = "×"; // La croix
        removeButton.dataset.pair = `${title1},${title2}`;

        // Écouteur pour la suppression
        removeButton.addEventListener("click", () => {
            const index = excludedPairs.findIndex(
                pair => pair[0] === title1 && pair[1] === title2
            );
            if (index !== -1) {
                excludedPairs.splice(index, 1);
                renderExcludedPairs(); // Rafraîchir la liste
                console.log(`Paire supprimée : ${title1}, ${title2}`);
            }
        });

        // Écouteur pour le toggle
        toggle.addEventListener("change", () => {
            console.log(
                `Paire "${title1}, ${title2}" changée à ${toggle.checked ? "ON" : "OFF"}`
            );
            updateAnalysis();
        });

        // Assembler les éléments
        listItem.appendChild(toggle);
        listItem.appendChild(label);
        listItem.appendChild(removeButton);
        pairsList.appendChild(listItem);
    });
}

// Ajouter une nouvelle paire via le champ de texte
document.getElementById("addExclusionBtn").addEventListener("click", () => {
    const input = document.getElementById("newExclusion").value.trim();

    if (input === "") {
        alert("Veuillez entrer une paire de titres à exclure.");
        return;
    }

    const titles = input.split(",").map(title => title.trim());
    if (titles.length !== 2 || titles[0] === "" || titles[1] === "") {
        alert("Veuillez entrer exactement deux titres séparés par une virgule.");
        return;
    }

    if (excludedPairs.some(pair => pair[0] === titles[0] && pair[1] === titles[1])) {
        alert("Cette paire de titres est déjà dans la liste des exclusions.");
        return;
    }

    excludedPairs.push(titles);
    renderExcludedPairs(); // Rafraîchir la liste
    document.getElementById("newExclusion").value = ""; // Effacer le champ de saisie
});


// Fonction pour mettre à jour l'analyse en fonction des cases cochées
function updateAnalysis() {
    const selectedExcludedPairs = updateSelectedExcludedPairs(); // Récupère les paires exclues

    console.log("Paires exclues sélectionnées :", selectedExcludedPairs);

    if (loadedXmlDoc) {
        analyzePrograms(analyzedPrograms, selectedExcludedPairs); // Utiliser les paires exclues
    } else {
        console.warn("Aucun fichier XML chargé. Impossible de mettre à jour l'analyse.");
    }
}

// Fonction pour afficher les résultats des erreurs et des trous dans des tables HTML
function displayXmlResults(errors, gaps) {
    console.log("Chevauchements détectés :", errors);
    console.log("Trous détectés :", gaps);

    // Afficher les chevauchements dans `overlapResultsTable`
    const overlapTableBody = document.querySelector("#overlapResultsTable tbody");
    overlapTableBody.innerHTML = ""; // Vider le tableau avant d'ajouter de nouvelles données

    errors.forEach(error => {
        const row = document.createElement("tr");
        row.innerHTML = `
            <td>${error.day}</td>
            <td>${error.currentTitle}</td>
            <td>${error.nextTitle}</td>
            <td>${error.duration.toFixed(1)}</td>
            <td>${error.overlapTime}</td>
        `;
        overlapTableBody.appendChild(row);
    });

    // Afficher les trous dans `gapResultsTable`
    const gapTableBody = document.querySelector("#gapResultsTable tbody");
    gapTableBody.innerHTML = ""; // Vider le tableau avant d'ajouter de nouvelles données

    gaps.forEach(gap => {
        const row = document.createElement("tr");
        row.innerHTML = `
            <td>${gap.day}</td>
            <td>${gap.currentTitle}</td>
            <td>${gap.nextTitle}</td>
            <td>${gap.duration.toFixed(1)}</td>
        `;
        gapTableBody.appendChild(row);
    });
}



// Appeler `renderExcludedTitles` pour afficher les cases à cocher au chargement de la page
document.addEventListener('DOMContentLoaded', () => {
    renderExcludedTitles();

    // Initialisation de `programs` avec les données de programmes ici.
    // Par exemple, si tu récupères tes données via une requête ou un fichier XML.
    programs = [
    ];

    // Lancer une première analyse initiale
    updateAnalysis();
});

// Fonction pour formater l'heure en HH:MM
function formatTime(date) {
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    return `${hours}:${minutes}`;
}

// Fonction pour formater l'heure en HH:MM:SS
function formatTime(date) {
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const seconds = String(date.getSeconds()).padStart(2, '0');
    return `${hours}:${minutes}:${seconds}`;
}

// Fonction pour afficher les résultats des chevauchements et des trous avec des couleurs
function displayXmlResults(errors, gaps) {
    const overlapResultsTableBody = document.getElementById('overlapResultsTable').querySelector('tbody');
    const gapResultsTableBody = document.getElementById('gapResultsTable').querySelector('tbody');
    overlapResultsTableBody.innerHTML = ''; // Réinitialiser le contenu précédent
    gapResultsTableBody.innerHTML = ''; // Réinitialiser le contenu précédent

    errors.forEach(error => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${error.day}</td>
            <td>${error.currentTitle}</td>
            <td>${error.nextTitle}</td>
            <td class="duration-blue">${Math.round(error.duration)} min</td>
            <td>${error.overlapTime}</td> <!-- Affichage de l'heure du chevauchement -->
        `;
        overlapResultsTableBody.appendChild(row);
    });

    gaps.forEach(gap => {
        const row = document.createElement('tr');
        let durationClass = getGapDurationClass(gap.duration);

        // Arrondir la durée à 10 secondes près
        const roundedDuration = Math.round(gap.duration * 6) / 6;

        row.innerHTML = `
            <td>${gap.day}</td>
            <td>${gap.currentTitle}</td>
            <td>${gap.nextTitle}</td>
            <td class="${durationClass}">${roundedDuration.toFixed(1)} min</td>
        `;
        gapResultsTableBody.appendChild(row);
    });

    if (errors.length === 0) {
        const noErrorRow = document.createElement('tr');
        noErrorRow.innerHTML = '<td colspan="5">Aucun chevauchement détecté.</td>';
        overlapResultsTableBody.appendChild(noErrorRow); // Changer colspan à 5 pour la nouvelle colonne
    }

    if (gaps.length === 0) {
        const noGapRow = document.createElement('tr');
        noGapRow.innerHTML = '<td colspan="4">Aucun trou détecté.</td>';
        gapResultsTableBody.appendChild(noGapRow);
    }
}

// Fonction pour déterminer la classe de couleur en fonction de la durée du trou
function getGapDurationClass(duration) {
    if (duration <= 3) {
        return 'duration-yellow';
    } else if (duration > 3 && duration <= 6) {
        return 'duration-orange';
    } else {
        return 'duration-red';
    }
}

// Fonction pour formater l'heure en HH:MM:SS
function formatTime(date) {
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const seconds = String(date.getSeconds()).padStart(2, '0');
    return `${hours}:${minutes}:${seconds}`;
}

// Fonction pour déterminer la classe de couleur en fonction de la durée du trou
function getGapDurationClass(duration) {
    if (duration <= 3) {
        return 'duration-yellow';
    } else if (duration > 3 && duration <= 6) {
        return 'duration-orange';
    } else {
        return 'duration-red';
    }
}

// Fonction pour déterminer la classe de couleur en fonction de la durée du trou
function getGapDurationClass(duration) {
    if (duration <= 3) {
        return 'duration-yellow';
    } else if (duration > 3 && duration <= 6) {
        return 'duration-orange';
    } else {
        return 'duration-red';
    }
}

// Fonction pour traiter le fichier de recherche générale
function handleSearchFile(file) {
    const fileLabel = document.getElementById('fileLabelSearch');
    fileLabel.textContent = file.name;
    fileLabel.classList.add('uploaded');

    readFileForSearch(file);
}

// Fonction pour lire et traiter le fichier de recherche Excel
function readFileForSearch(file) {
    const reader = new FileReader();
    reader.onload = function (event) {
        const data = new Uint8Array(event.target.result);
        const workbook = XLSX.read(data, { type: 'array' });
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];

        const jsonSheet = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
        populateDateDropdown(jsonSheet); // Populer le menu déroulant avec les jours de la semaine
    };
    reader.readAsArrayBuffer(file);
}

// Fonction pour populater le menu déroulant des dates
function populateDateDropdown(sheet) {
    uniqueDates.clear();
    const joursSemaine = ['lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi', 'dimanche'];

    sheet.slice(1).forEach(row => {
        if (row[0]) {
            const date = row[0].toLowerCase().trim();
            joursSemaine.forEach(jour => {
                if (date.startsWith(jour)) {
                    uniqueDates.add(row[0].trim());
                }
            });
        }
    });

    // Trier les dates par ordre de la semaine et ensuite par date
    const sortedDates = Array.from(uniqueDates).sort((a, b) => {
        const jourA = joursSemaine.indexOf(a.split(' ')[0].toLowerCase());
        const jourB = joursSemaine.indexOf(b.split(' ')[0].toLowerCase());

        if (jourA !== jourB) {
            return jourA - jourB;
        }

        const dateA = new Date(a.split(' ')[1].split('/').reverse().join('-'));
        const dateB = new Date(b.split(' ')[1].split('/').reverse().join('-'));

        return dateA - dateB;
    });

    const searchDateSelect = document.getElementById('searchDate');
    searchDateSelect.innerHTML = '<option value="">Tous les jours</option>';

    sortedDates.forEach(date => {
        const option = document.createElement('option');
        option.value = date;
        option.text = date;
        searchDateSelect.appendChild(option);
    });
}

// Fonction pour traiter le fichier du programme Mag
function handleSecondFile(file) {
    const fileLabel = document.getElementById('fileLabelMag');
    fileLabel.textContent = file.name;
    fileLabel.classList.add('uploaded');

    readFileForSecond(file);
}

// Lire et traiter le second fichier Excel (Programme Mag)
function readFileForSecond(file) {
    const reader = new FileReader();
    reader.onload = function (event) {
        try {
            const data = new Uint8Array(event.target.result);
            const workbook = XLSX.read(data, { type: 'array' });
            const firstSheetName = workbook.SheetNames[0];
            const worksheet = workbook.Sheets[firstSheetName];

            const jsonSheet = XLSX.utils.sheet_to_json(worksheet, { header: 1, range: 4 });
            displayProgramForCurrentDay(jsonSheet);
        } catch (error) {
            console.error("Erreur de lecture du fichier Programme Mag :", error);
            alert("Erreur lors de la lecture du fichier Programme Mag. Veuillez vérifier le format du fichier.");
        }
    };

    // Lire uniquement les fichiers .xlsx
    reader.readAsArrayBuffer(file);
}

// Afficher le programme du jour pour le second fichier sous forme de tableau avec exclusions
function displayProgramForCurrentDay(sheet) {
    const today = new Date();
    const dayNames = ['dimanche', 'lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi'];
    const currentDayName = dayNames[today.getDay()];
    const formattedDay = currentDayName;

    const scheduleContainer = document.getElementById('magSchedule');
    scheduleContainer.innerHTML = ''; // Réinitialiser le contenu précédent

    const excludedTitles = ["Le Journal", "Les Yeux dans les Yeux", "Genève à Chaud", "Conseil Municipal","Grand Conseil"];
    const defaultStartTime = '17:29:59';
    const defaultEndTime = '21:00:00';
    const extendedStartTime = '17:29:59';
    const extendedEndTime = '23:59:59';

    // Étape 1 : Vérifier si "Conseil Municipal" ou "Grand Conseil" est présent dans le programme
    let isExtendedTime = false;
    sheet.forEach(row => {
        const title = row[5] ? row[5].trim() : '';
        if (title === "Conseil Municipal" || title === "Grand Conseil") {
            isExtendedTime = true; // Étendre la plage horaire si l'un des titres est trouvé
        }
    });

    // Étape 2 : Filtrer les émissions en fonction de la plage horaire ajustée
    const filteredRows = sheet.filter(row => {
        const day = row[0] ? row[0].toLowerCase().trim().split(' ')[0] : '';
        const startTime = row[1] ? convertExcelTime(row[1]) : '';
        const title = row[5] ? row[5].trim() : '';

        // Vérifier les conditions d'exclusion : titres et tranche horaire
        const isExcludedTitle = excludedTitles.includes(title);
        const isExcludedTime = isExtendedTime
            ? (startTime >= '18:30:00' && startTime < '19:59:59')  // Exclure entre 18:30:00 et 19:59:59 si étendu
            : (startTime >= '18:30:00' && startTime < '19:59:59'); // Exclure entre 18:30:00 et 19:59:59 sinon

        // Plage horaire dynamique en fonction de la variable isExtendedTime
        const startTimeRange = isExtendedTime ? extendedStartTime : defaultStartTime;
        const endTimeRange = isExtendedTime ? extendedEndTime : defaultEndTime;

        return (
            day === formattedDay &&
            startTime >= startTimeRange &&
            startTime <= endTimeRange &&
            !isExcludedTitle &&
            !isExcludedTime
        );
    });

    if (filteredRows.length === 0) {
        scheduleContainer.innerHTML = '<p>Aucune émission trouvée pour aujourd\'hui dans la plage horaire spécifiée.</p>';
        return;
    }

    // Créer le tableau pour afficher les émissions
    const table = document.createElement('table');
    table.style.width = '100%';
    table.style.borderCollapse = 'collapse';

    // Ajouter l'en-tête du tableau
    const thead = document.createElement('thead');
    const headerRow = document.createElement('tr');

    ['Jour', 'Heure de Diffusion', 'Titre de l\'Émission', 'Description'].forEach(headerText => {
        const th = document.createElement('th');
        th.textContent = headerText;
        headerRow.appendChild(th);
    });

    thead.appendChild(headerRow);
    table.appendChild(thead);

    // Ajouter le corps du tableau
    const tbody = document.createElement('tbody');

    filteredRows.forEach(row => {
        const tableRow = document.createElement('tr');

        const dayCell = document.createElement('td');
        dayCell.textContent = formattedDay;
        tableRow.appendChild(dayCell);

        const timeCell = document.createElement('td');
        timeCell.textContent = convertExcelTime(row[1]);
        tableRow.appendChild(timeCell);

        const titleCell = document.createElement('td');
        titleCell.textContent = row[5];
        tableRow.appendChild(titleCell);

        const descriptionCell = document.createElement('td');
        descriptionCell.textContent = row[6];
        tableRow.appendChild(descriptionCell);

        tbody.appendChild(tableRow);
    });

    table.appendChild(tbody);
    scheduleContainer.appendChild(table);
}

// Déclencher la recherche
function performSearch() {
    const fileInput = document.getElementById('uploadSearch');
    const searchString = document.getElementById('searchString').value.toLowerCase();
    const searchDate = document.getElementById('searchDate').value;
    const startTime = document.getElementById('startTime').value;
    const endTime = document.getElementById('endTime').value;

    if (fileInput.files.length === 0) {
        alert("Veuillez sélectionner un fichier Excel pour la recherche.");
        return;
    }

    const file = fileInput.files[0];
    const fileName = file.name.toLowerCase();

    if (fileName.startsWith("programme")) {
        searchColumnIndex = 5;
        timeColumns = [1, 2, 3, 6];
    } else if (fileName.startsWith("export")) {
        searchColumnIndex = 4;
        timeColumns = [1, 2, 6];
    } else {
        alert("Nom de fichier non pris en charge.");
        return;
    }

    searchStringGlobal = searchString;
    const reader = new FileReader();

    reader.onload = function (event) {
        const data = new Uint8Array(event.target.result);
        const workbook = XLSX.read(data, { type: 'array' });
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];

        const jsonSheet = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
        const formattedSheet = formatTimeColumns(jsonSheet);
        displayResults(formattedSheet, searchString, fileName, searchDate, startTime, endTime);
    };

    reader.readAsArrayBuffer(file);
}

// Formatage des colonnes d'heure
function formatTimeColumns(sheet) {
    return sheet.map((row, rowIndex) => {
        return row.map((cell, colIndex) => {
            if (rowIndex > 0 && timeColumns.includes(colIndex) && typeof cell === 'number') {
                return convertExcelTime(cell);
            }
            return cell;
        });
    });
}

// Convertir le temps Excel en format lisible
function convertExcelTime(excelTime) {
    const totalSeconds = Math.floor(excelTime * 86400);
    const hours = String(Math.floor(totalSeconds / 3600)).padStart(2, '0');
    const minutes = String(Math.floor((totalSeconds % 3600) / 60)).padStart(2, '0');
    return `${hours}:${minutes}`;
}

// Fonction pour filtrer les colonnes
function filterColumns(row, fileName) {
    if (fileName.startsWith("programme")) {
        return [row[0], row[1], row[2], row[3], row[5], row[6]];
    } else if (fileName.startsWith("export")) {
        return [row[0], row[1], row[2], row[4], row[5], row[6]];
    }
    return row;
}

// Affiche les résultats de la recherche avec alternance de couleur des lignes
function displayResults(sheet, searchString, fileName, searchDate, startTime, endTime) {
    const resultsTable = document.getElementById('resultsTable');
    const tbody = resultsTable.querySelector('tbody');
    const thead = resultsTable.querySelector('thead');

    tbody.innerHTML = '';
    thead.innerHTML = '';
    matchingRows = [];

    if (sheet.length === 0) {
        alert("Le fichier est vide.");
        return;
    }

    // Définir les entêtes des colonnes
    const headers = ['Date', 'Heure IN', 'Heure OUT', 'Durée', 'Titre', 'Description'];
    const headerRow = document.createElement('tr');
    headers.forEach(header => {
        const th = document.createElement('th');
        th.textContent = header;
        headerRow.appendChild(th);
    });
    thead.appendChild(headerRow);

    // Filtrer les colonnes pour afficher
    matchingRows = sheet.filter(row => {
        const rowDate = row[0] ? row[0].trim() : '';
        const rowTime = row[1] || '';

        const matchesString = row[searchColumnIndex] && String(row[searchColumnIndex]).toLowerCase().includes(searchString);
        const matchesDate = !searchDate || rowDate === searchDate;
        const matchesTime = !startTime || !endTime || compareTime(rowTime, startTime, endTime);

        return matchesString && matchesDate && matchesTime;
    }).map(row => filterColumns(row, fileName));

    // Affichage des résultats filtrés
    matchingRows.forEach((row, index) => {
        const tr = document.createElement('tr');
        // Appliquer une couleur de fond alternée
        if (index % 2 === 1) {
            tr.style.backgroundColor = '#aec3df'; // Couleur de fond pour une ligne sur deux
        }
        row.forEach(cell => {
            const td = document.createElement('td');
            td.textContent = cell;
            tr.appendChild(td);
        });
        tbody.appendChild(tr);
    });

    if (matchingRows.length === 0) {
        alert("Aucune correspondance trouvée.");
        document.getElementById('downloadBtn').disabled = true;
    } else {
        document.getElementById('downloadBtn').disabled = false;
    }
}

// Compare l'heure
function compareTime(rowTime, startTime, endTime) {
    if (rowTime.length === 5) rowTime += ':00'; // Ajouter les secondes si elles sont manquantes
    return rowTime >= startTime && rowTime <= endTime;
}

// Fonction pour générer le fichier Excel avec en-tête personnalisé et charte graphique adaptée
async function generateExcel() {
    if (matchingRows.length === 0) {
        alert("Aucune donnée à télécharger.");
        return;
    }

    // Créer un nouveau classeur
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("Résultats");

    // Récupérer l'émission correspondant à la recherche dans la colonne F, ligne 6
    let emissionUnique = "";
    if (matchingRows.length > 6 && matchingRows[6].length > 4) {
        emissionUnique = matchingRows[6][4]; // Récupérer la valeur de la colonne F (index 5) à la ligne 6 (index 6)
    } else {
        emissionUnique = "Non spécifiée"; // Valeur par défaut si l'émission n'est pas trouvée
    }

    // En-tête personnalisé
    worksheet.mergeCells('A1:G1');
    worksheet.getCell('A1').value = `Résultats de la recherche pour l'émission : "${emissionUnique}"`;
    worksheet.getCell('A1').font = { size: 24, bold: true, color: { argb: 'FFFFFFFF' } };
    worksheet.getCell('A1').alignment = { vertical: 'middle', horizontal: 'center' };
    worksheet.getCell('A1').fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FF6c8cb7' } // Couleur de fond adaptée à la charte
    };
    worksheet.getRow(1).height = 40;

    // Ajouter la date de génération du rapport
    worksheet.mergeCells('A2:G2');
    worksheet.getCell('A2').value = `Date de Génération : ${new Date().toLocaleDateString()}`;
    worksheet.getCell('A2').alignment = { vertical: 'middle', horizontal: 'center' };
    worksheet.getCell('A2').fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FF6c8cb7' } // Couleur de fond adaptée à la charte
    };
    worksheet.getCell('A2').font = { color: { argb: 'FFFFFFFF' } };
    worksheet.getRow(2).height = 30;

    // Laisser des lignes vides
    worksheet.addRow([]);
    worksheet.addRow([]);

    // En-têtes des colonnes de données avec largeur ajustée
    const headerRow = worksheet.addRow(['Jour', 'Date', 'Heure IN', 'Heure OUT', 'Durée', 'Titre', 'Description']);
    headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' } }; // Texte en blanc
    headerRow.alignment = { vertical: 'middle', horizontal: 'center' };
    headerRow.height = 30;

    headerRow.eachCell({ includeEmpty: false }, (cell, colNumber) => {
        if (colNumber <= 7) { // Appliquer le style jusqu'à la colonne G
            cell.fill = {
                type: 'pattern',
                pattern: 'solid',
                fgColor: { argb: 'FF6c8cb7' } // Couleur de fond adaptée à la charte
            };
        }
    });

    // Ajuster la largeur des colonnes, avec les colonnes plus larges pour "Description"
    const columnWidths = [
        15, // Jour
        15, // Date
        12, // Heure IN
        12, // Heure OUT
        10, // Durée
        30, // Titre
        50  // Description
    ];
    columnWidths.forEach((width, index) => {
        worksheet.getColumn(index + 1).width = width;
    });

    // Ajouter les données
    let previousDay = "";
    matchingRows.slice(1).forEach(row => {
        const originalDateColumn = row[0]; // La colonne d'origine contenant "Jour dd/mm/yyyy"
        const dayPart = originalDateColumn.match(/^\D+/)[0].trim(); // Extraire le jour (texte jusqu'au premier chiffre)
        const datePart = originalDateColumn.match(/\d{2}\/\d{2}\/\d{4}/)[0]; // Extraire la date (format dd/mm/yyyy)

        if (previousDay && previousDay !== dayPart) {
            // Ajouter une ligne vide pour séparer les groupes de jours
            const emptyRow = worksheet.addRow(new Array(7).fill(""));
            emptyRow.height = 20; // Hauteur des lignes vides
            emptyRow.eachCell({ includeEmpty: false }, (cell, colNumber) => {
                if (colNumber <= 7) { // Appliquer le style jusqu'à la colonne G
                    cell.fill = {
                        type: 'pattern',
                        pattern: 'solid',
                        fgColor: { argb: 'FFDDEBF7' } // Couleur douce (nuance plus claire de #6c8cb7)
                    };
                }
            });
        }

        const dataRow = worksheet.addRow([
            dayPart, // Nouvelle colonne "Jour"
            datePart, // Nouvelle colonne "Date"
            row[1], // Heure IN
            row[2], // Heure OUT
            row[3], // Durée
            row[4], // Titre
            row[5]  // Description
        ]);

        // Appliquer le style gras à la colonne "Jour"
        dataRow.getCell(1).font = { bold: true };
        dataRow.height = 20; // Hauteur des lignes de données

        previousDay = dayPart;
    });

    // Récupérer la liste des jours uniques
    const uniqueDays = [...new Set(matchingRows.slice(1).map(row => row[0].match(/^\D+/)[0].trim()))];

    // Construire le message avec la liste des jours
    const dayMessage = `Ce rapport détaille les diffusions pour les jours suivants : ${uniqueDays.join(', ')}.`;

    // Ajouter le message avec les jours
    worksheet.addRow([]);
    const messageRow = worksheet.addRow([dayMessage]);
    worksheet.mergeCells(`A${messageRow.number}:G${messageRow.number}`);
    messageRow.getCell(1).font = { italic: true }; // Texte en italique pour le message

    // Ajouter le texte de contact
    const contactRow = worksheet.addRow(['Pour toute question, veuillez contacter : stephane.mex@lemanbleu.ch']);
    worksheet.mergeCells(`A${contactRow.number}:G${contactRow.number}`);
    contactRow.getCell(1).font = { italic: true, color: { argb: 'FF6c8cb7' } }; // Texte en italique et couleur de la charte

    // Enregistrer le fichier Excel
    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `resultats_recherche_${new Date().toISOString().slice(0, 10)}.xlsx`;
    a.click();
    window.URL.revokeObjectURL(url);

    showMessage(`Fichier Excel généré avec succès et téléchargé.`);
}


// Fonction pour vérifier que le fichier correspond à la semaine en cours
function validateWeekNumber(fileName) {
    const weekNumberFromFileName = extractWeekNumber(fileName);
    const currentWeekNumber = getWeekNumber(new Date());

    return weekNumberFromFileName === currentWeekNumber;
}

// Extraire le numéro de semaine du nom de fichier
function extractWeekNumber(fileName) {
    const match = fileName.match(/sem (\d+)/i); // Regex pour extraire le numéro de semaine
    return match ? parseInt(match[1], 10) : null;
}

// Calculer le numéro de la semaine actuelle
function getWeekNumber(d) {
    d = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
    const dayNum = d.getUTCDay() || 7;
    d.setUTCDate(d.getUTCDate() + 4 - dayNum);
    const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
    const weekNo = Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
    return weekNo;
}

document.addEventListener("DOMContentLoaded", () => {
    // Sélectionne tous les éléments avec "data-link"
    const links = document.querySelectorAll("[data-link]");

    // Ajoute un gestionnaire d'événements pour chaque élément
    links.forEach(link => {
        link.addEventListener("click", event => {
            event.preventDefault(); // Empêche l'action par défaut
            const target = link.getAttribute("data-link"); // Récupère l'URL cible
            console.log("Redirection vers :", target); // Pour vérifier dans la console
            window.location.href = target; // Redirige vers l'URL cible
        });
    });
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
