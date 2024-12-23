const API_KEY = 'AIzaSyCAMKmbieLWaJhhY3k4tZ4rIw6r03RPV7A'; // Replace with your actual Gemini AI API key
const API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent';
const planForm = document.getElementById('planForm');
const studyPlanDiv = document.getElementById('studyPlan');
const downloadPdfButton = document.getElementById('downloadPdf');
const loadingDiv = document.getElementById('loading');
const errorDiv = document.getElementById('error');
const themeToggle = document.getElementById('themeToggle');

planForm.addEventListener('submit', generatePlan);
downloadPdfButton.addEventListener('click', downloadPdf);
themeToggle.addEventListener('click', toggleTheme);

async function generatePlan(e) {
    e.preventDefault();
    const topic = document.getElementById('topic').value;
    const proficiency = document.getElementById('proficiency').value;

    loadingDiv.style.display = 'block';
    errorDiv.textContent = '';
    studyPlanDiv.innerHTML = '';
    studyPlanDiv.style.display = 'none';
    downloadPdfButton.style.display = 'none';

    try {
        const plan = await generateStudyPlan(topic, proficiency);
        displayStudyPlan(plan);
        downloadPdfButton.style.display = 'block';
    } catch (error) {
        console.error('Error:', error);
        errorDiv.textContent = `An error occurred: ${error.message}`;
    } finally {
        loadingDiv.style.display = 'none';
    }
}

async function generateStudyPlan(topic, proficiency) {
    let daysRange, contentLevel, additionalInstructions = '';
    switch (proficiency) {
        case 'newbie':
            daysRange = '30-40';
            contentLevel = 'basic concepts';
            break;
        case 'beginner':
            daysRange = '40-50';
            contentLevel = 'basic to intermediate concepts';
            break;
        case 'intermediate':
            daysRange = '50-60';
            contentLevel = 'intermediate to advanced concepts';
            break;
        case 'expert':
            daysRange = '30-40';
            contentLevel = 'advanced concepts and projects';
            break;
    }

    if (topic === 'jsProblems') {
        additionalInstructions = 'Include JavaScript coding problems and concepts. Reference w3schools and jschallenger for problem ideas, but create unique problems. Mix theoretical concepts with practical coding challenges.';
    } else if (topic === 'webDev') {
        additionalInstructions = 'Include miscellaneous topics such as web standards, accessibility, design for developers, version control, and web security. Adjust the depth and breadth of these topics based on the proficiency level.';
    }

    const prompt = `Remember that you've been a globally recognized educator, and an even more outstanding web developer for more than 3 decades. You've helped lakhs of students, educators, web developers, professional web devs, college students, institutions-colleges universities, companies, and so many more. Use all your experience here, to help this web developer, according to their need. The plan should be such that a newbie can advance to a beginner level, a beginner to an intermediate web developer, and an intermediate web developer to an expert level. Also, the plan for expert level should mainly be about projects, challenges, crash courses, etc. Create a simplified yet comprehensive study plan for a ${proficiency} level web developer learning ${topic}. The plan should cover ${daysRange} days, focusing on ${contentLevel}. Group the days into weeks for easier navigation. ${additionalInstructions}

For each week, provide:
1. Main topics to be covered (enclosed in double quotes)
2. 3-4 free learning resources (documentation, tutorials, video courses) with actual URLs
3. A simple project idea related to the week's topics

Format the plan as follows:
Week 1 (Days 1-7):
"Main topics"
- [List of topics]
Resources:
• [Resource 1 Title] - 
[URL]
• [Resource 2 Title] - 
[URL]
• [Resource 3 Title] - 
[URL]
• [Resource 4 Title] - 
[URL]
Project idea: [Brief project description]

Week 2 (Days 8-14):
...

Continue this format for all weeks. Ensure all resources are free, easily accessible, and directly related to ${topic}. For experts, include more project-based learning and advanced documentation links. Keep the plan straightforward and helpful for learners at the ${proficiency} level.`;

    const response = await fetch(`${API_URL}?key=${API_KEY}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }]
        })
    });

    if (!response.ok) {
        throw new Error(`API request failed with status ${response.status}`);
    }

    const data = await response.json();
    return data.candidates[0].content.parts[0].text;
}

function displayStudyPlan(plan) {
    const weeks = plan.split('\n\n');
    let html = '<h2>Your Personalized Web Development Study Plan</h2>';

    weeks.forEach((week, weekIndex) => {
        const [weekTitle, ...content] = week.split('\n');
        html += `<div class="week-plan">
                    <h2>${weekTitle}</h2>`;
        
        content.forEach((line, lineIndex) => {
            if (line.startsWith('"') && line.endsWith('"')) {
                html += `<h2>${line.slice(1, -1)}</h2>`;
            } else if (line.startsWith('-')) {
                html += `<ul><li>${line.substring(2)}</li></ul>`;
            } else if (line.startsWith('•')) {
                const [title, url] = line.substring(2).split(' - ');
                html += `<div class="resource-link">
                            <input type="checkbox" id="week${weekIndex}-resource${lineIndex}" class="topic-checkbox">
                            <label for="week${weekIndex}-resource${lineIndex}">
                                <a href="${url}" target="_blank" rel="noopener noreferrer">${title}</a>
                            </label>
                          </div>`;
            } else if (line.startsWith('Project idea:')) {
                html += `<p><strong>${line}</strong></p>`;
            } else {
                const boldRegex = /\*\*(.*?)\*\*/g;
                const formattedLine = line.replace(boldRegex, '<h2>$1</h2>');
                html += `<p>${formattedLine}</p>`;
            }
        });
        
        html += `</div>`;
    });

    studyPlanDiv.innerHTML = html;
    studyPlanDiv.style.display = 'block';

    // Add event listeners to save checkbox states
    document.querySelectorAll('.topic-checkbox').forEach(checkbox => {
        checkbox.addEventListener('change', saveCheckboxStates);
        // Set initial state from localStorage
        const savedState = localStorage.getItem(checkbox.id);
        if (savedState === 'true') {
            checkbox.checked = true;
        }
    });
}

function saveCheckboxStates() {
    document.querySelectorAll('.topic-checkbox').forEach(checkbox => {
        localStorage.setItem(checkbox.id, checkbox.checked);
    });
}

function downloadPdf() {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    const content = document.getElementById('studyPlan');
    doc.setFontSize(12);
    doc.setTextColor(0, 0, 0);
    let yPosition = 15;
    const lineHeight = 7; // Initial line height
    const linkSpacing = 2; // Desired spacing for links

    function addTextToPDF(text, isHeader = false) {
        const lines = doc.splitTextToSize(text, 170); // Split text to fit width
        let currentLineHeight = lineHeight;

        if (isHeader) {
            doc.setFontSize(14);
            doc.setFont(undefined, 'bold');
            currentLineHeight = lineHeight;
        } else {
            doc.setFontSize(12);
            doc.setFont(undefined, 'normal');
             currentLineHeight = lineHeight;
        }

        for (const line of lines) {
            if (yPosition + currentLineHeight > 280) {
                doc.addPage();
                yPosition = 15;
            }
            doc.text(line, 15, yPosition);
            yPosition += currentLineHeight;
        }
    }

     function addLinkToPDF(text, url) {
        if (yPosition + lineHeight > 280) {
            doc.addPage();
            yPosition = 15;
        }
        const lines = doc.splitTextToSize(text, 170);
          for (const line of lines) {
            doc.setTextColor(0, 0, 255);
             doc.textWithLink(line, 15, yPosition, { url: url });
             doc.setTextColor(0, 0, 0);
            yPosition += lineHeight+linkSpacing;
            }

    }


    // Traverse through the content and add text to PDF
    const traverse = (node) => {
        for (const child of node.childNodes) {
            if (child.nodeType === Node.TEXT_NODE) {
                const trimmedText = child.textContent.trim();
                if (trimmedText) {
                    addTextToPDF(trimmedText);
                }
            } else if (child.nodeType === Node.ELEMENT_NODE) {
                if (child.tagName === 'H2') {
                    addTextToPDF(child.textContent, true);
                } else if (child.tagName === 'A') {
                    const linkText = child.textContent;
                    const linkUrl = child.href;
                    doc.setTextColor(0, 0, 255);
                    doc.textWithLink(linkText, 15, yPosition, { url: linkUrl });
                    doc.setTextColor(0, 0, 0);
                    yPosition += 7; // Reduced from 7 to 5
                } else {
                    traverse(child);
                }
            }
        }
    };

    traverse(content);

    const topic = document.getElementById('topic').value;
    const proficiency = document.getElementById('proficiency').value;
    doc.save(`web_development_study_plan_${topic}_${proficiency}.pdf`);
}

function toggleTheme() {
    document.body.classList.toggle('light-theme');
    themeToggle.textContent = document.body.classList.contains('light-theme') ? '☀️' : '🌙';
}

