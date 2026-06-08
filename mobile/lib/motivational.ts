// Motivational quotes for habit completion
const quotes = [
    "Every rep counts. Keep going! 💪",
    "Consistency beats intensity. 🎯",
    "You're building something great! 🚀",
    "Small steps, big results. 🌟",
    "Winners don't quit. 🏆",
    "You showed up. That's what matters. ✨",
    "Discipline is choosing between what you want now and what you want most. 🔥",
    "The secret of getting ahead is getting started. 🎉",
    "Success is the sum of small efforts, repeated. 💎",
    "You're on fire! Keep it lit. 🔥",
];

export function getHabitCompleteQuote(): string {
    return quotes[Math.floor(Math.random() * quotes.length)];
}
