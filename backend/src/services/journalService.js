// services/journalService.js
// Generates a supportive, non-diagnostic reflection on a journal entry.
// Previously this used IBM watsonx Orchestrate. It now calls watsonx.ai directly.
//
// CONSTRAINTS (enforced in prompt):
//   - Use second-person, empathic language ("You mentioned...", "It sounds like...")
//   - No diagnosis, no clinical labels, no percentages
//   - Exactly 3–4 short observations followed by one self-care suggestion
//   - End with a reminder that this is not clinical advice

const { chat } = require('./watsonxClient');

function buildReflectionPrompt(entryText) {
  return `You are a compassionate journaling companion for MindGuard AI.
Read the journal entry below and respond with a gentle, supportive reflection.

STRICT RULES:
1. Write exactly 3 to 4 short observations in second person (e.g., "You seem to be...")
2. End with ONE practical self-care suggestion (e.g., a breathing exercise, a walk, talking to a friend)
3. Do NOT diagnose any mental health condition.
4. Do NOT use clinical language (no "depression", "anxiety disorder", "risk level", percentages).
5. Do NOT say "I" — address the writer as "you".
6. Keep the total response under 150 words.
7. Final sentence must be: "Remember, this reflection is not clinical advice — a mental health professional can offer personalised support."

Journal Entry:
"""
${entryText.slice(0, 1000)}
"""

Supportive Reflection:`;
}

/**
 * Generate a supportive reflection for a journal entry.
 * @param {string} entryText - the user's journal entry
 * @returns {Promise<string>} - the reflection text
 */
async function generateReflection(entryText) {
  if (!entryText || entryText.trim().length < 10) {
    return 'Your entry is very brief. Even writing a few words is a meaningful step. Consider adding a little more when you feel ready. Remember, this reflection is not clinical advice — a mental health professional can offer personalised support.';
  }

  const prompt = buildReflectionPrompt(entryText);
  const reflection = await chat(prompt, {
    max_new_tokens:     250,
    temperature:        0.6,
    repetition_penalty: 1.2,
  });

  // Ensure the safety disclaimer is always present
  const disclaimer = 'Remember, this reflection is not clinical advice — a mental health professional can offer personalised support.';
  if (!reflection.includes('not clinical advice')) {
    return reflection.trim() + '\n\n' + disclaimer;
  }
  return reflection.trim();
}

/**
 * Generate a supportive summary for a wellness check-in.
 * @param {number} moodScore  - integer 1–10
 * @param {string} note       - optional free-text note
 * @returns {Promise<string>}
 */
async function generateCheckinSummary(moodScore, note) {
  const noteText = note ? `\nOptional note: "${note.slice(0, 300)}"` : '';
  const prompt   = `You are a supportive wellness companion for MindGuard AI.
The user has rated their mood today as ${moodScore}/10.${noteText}

Write 2–3 warm, encouraging sentences acknowledging their check-in.
Do NOT diagnose. Do NOT use clinical labels. Keep it under 80 words.
If the mood is 3 or below, gently suggest speaking to someone they trust or a professional.
Final sentence: "Remember, this summary is not clinical advice."

Response:`;

  const summary = await chat(prompt, {
    max_new_tokens:     150,
    temperature:        0.6,
  });

  const disclaimer = 'Remember, this summary is not clinical advice.';
  if (!summary.includes('not clinical advice')) {
    return summary.trim() + ' ' + disclaimer;
  }
  return summary.trim();
}

module.exports = { generateReflection, generateCheckinSummary };
