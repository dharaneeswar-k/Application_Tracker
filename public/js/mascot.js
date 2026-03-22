const motivations = [
    "Hey! Your chance of hiring increased 10% since last week. Keep pushing! 🚀",
    "To-dos are waiting! Let's crush them together. 💪",
    "You're doing great! Every task finished is a step closer to your dream job. ✨",
    "Consistency is key! You are becoming a top-tier candidate. 🏆",
    "Productivity is at an all-time high! Stay focused. 🔥",
    "A quick reminder: you're awesome. Let's finish that plan! 🌟",
    "Analyzing your progress... You're ahead of 80% of other applicants! 📈",
    "Success loves speed! Don't let those todos sit too long. ⚡"
];

const milestoneMsgs = {
    taskDone: [
        "Boom! Another task down. You're unstoppable! 🔥",
        "Nice work on finishing that! Your productivity score just went up! 📈",
        "Excellent! One less thing to worry about. Keep it up! 🚀"
    ],
    planDone: [
        "Incredible! You completed a study block. Knowledge is power! 📚",
        "Study session finished! You're sharpening your skills perfectly. ✨",
        "One step closer to mastering those topics! Great job! 🌟"
    ],
    appStatusChange: [
        "Great move! Updating your application status shows real progress. 📈",
        "One step closer to that interview! Keep the momentum going. 🚀",
        "Brilliant! Keeping your board organized is a sign of a pro. 🏆"
    ],
    appInterviewed: [
        "YES! An interview! This is your moment to shine. You got this! ✨",
        "Interview invite? Amazing! Time to show them why you're the best. 🌟",
        "Preparing for an interview? You're already ahead of the game! 💪"
    ],
    appApplied: [
        "Another application sent! You're planting seeds for a great career. 🌱",
        "Applied! Every application is a new opportunity. Keep it up! ⚡",
        "Nice one! Your pipeline is looking strong today. 📈"
    ],
    appDeleted: [
        "No worries! Onto the next big thing. Stay focused! 🚀",
        "Cleaned up your board? Good! Clarity leads to results. ✨",
        "Record removed. Let's find something even better! 🌟"
    ],
    noteSaved: [
        "Note secured! Your memory just got an upgrade. 🧠",
        "Brilliant thought! I've saved it safely for you. ✨",
        "Documentation is king! Great job capturing that. 📚"
    ],
    sparkyClicked: [
        "Hey! Stop tickling me and get back to work! 😂",
        "You clicked! That's 5 productivity points for you! ✨",
        "I'm here for you! Need a boost? You're doing amazing! 🌟",
        "Fedo! at your service! Let's crush those goals! 💪"
    ]
};

function showMascot(msg = null) {
    const container = document.getElementById('mascot-container');
    const text = document.getElementById('mascot-text');
    if (!container || !text) return;

    const randomMsg = motivations[Math.floor(Math.random() * motivations.length)];
    text.innerText = msg || randomMsg;

    container.classList.add('active');

    // Auto hide after 8 seconds
    const timeoutId = setTimeout(() => {
        if (container.classList.contains('active')) {
            hideMascot();
        }
    }, 8000);

    // Store timeout to clear if another one triggers
    container.dataset.timeoutId = timeoutId;
}

function hideMascot() {
    const container = document.getElementById('mascot-container');
    if (container) {
        container.classList.remove('active');
        clearTimeout(container.dataset.timeoutId);
    }
}

// Random rare pops
function startRandomMotivations() {
    setInterval(() => {
        // 15% chance to show every 4 minutes
        if (Math.random() < 0.15) {
            showMascot();
        }
    }, 4 * 60 * 1000);
}

// Global hook for other scripts
window.motivateUser = function (type = null, manualMsg = null) {
    if (manualMsg) {
        showMascot(manualMsg);
        return;
    }

    if (type && milestoneMsgs[type]) {
        const msgs = milestoneMsgs[type];
        const randomMilestone = msgs[Math.floor(Math.random() * msgs.length)];
        showMascot(randomMilestone);
    } else {
        showMascot();
    }
};

document.addEventListener('DOMContentLoaded', () => {
    // Initial motivation after 2 seconds
    setTimeout(() => {
        const username = localStorage.getItem('username') || 'Friend';
        showMascot(`Hi ${username}! Fedo! here. Let's make today count! ✨`);
    }, 2000);

    // Interactive Fedo!
    const img = document.getElementById('mascot-img');
    if (img) {
        img.addEventListener('click', (e) => {
            e.stopPropagation();
            window.motivateUser('sparkyClicked');
        });
    }

    startRandomMotivations();
});
