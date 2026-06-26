# Ritual Chain Workshop - Privacy-Preserving AI Bounty Judge

This repository contains the updated `AIJudge` smart contract which implements a **Commit-Reveal scheme** to ensure that answers remain hidden until the judging phase. This prevents participants from copying each other's ideas during the active bounty submission window.

## Architecture Note: Commit-Reveal Bounty System
1. **Commit Phase (Before Deadline)**: Participants compute a hash (commitment) of their answer locally using `keccak256(abi.encodePacked(answer, salt, msg.sender, bountyId))` and submit *only the hash* on-chain via `submitCommitment()`. The plaintext answers remain **off-chain** and completely hidden.
2. **Reveal Phase (After Deadline)**: Once the submission deadline has passed, the `revealAnswer()` function is unlocked. Participants submit their plaintext answer and salt. The smart contract recalculates the hash and verifies it against the stored commitment. If it matches, the plaintext answer is saved on-chain.
3. **AI Judging**: The AI model (via Ritual TEE execution) reads the revealed answers in batch using the `judgeAll()` function. Because reveals happen only *after* the submission window closes, no participant can copy a revealed answer and submit it as their own.

## What is On-Chain vs Off-Chain?
- **Off-Chain**: The plaintext answer (during the commit phase), the user's secret salt.
- **On-Chain**: The commitment hashes, the deadline logic, and eventually (during the reveal phase), the revealed plaintext answers and AI judgment results. 

## Test Plan for Reveal Cases
The `AIJudge` contract includes tests covering the complete commit-reveal flow. Run tests in the `hardhat` folder using:
```shell
npx hardhat test
```
The test suite explicitly verifies:
- **Successful Reveals**: A user can commit before the deadline and successfully reveal after the deadline using the correct salt.
- **Failed Reveals**: Attempting to reveal *before* the deadline reverts with `"reveal phase not started"`. 
- **Late Commits**: Attempting to commit *after* the deadline reverts with `"submissions closed"`.

## Reflection Question
> "What should be public, what should stay hidden, and what should be decided by AI versus by a human in a bounty system?"

**Answer:**
In a bounty system, the bounty criteria, rubric, deadline, and reward amount must be completely public to ensure transparency and fairness. The submissions, however, should stay hidden (e.g., via commit-reveal or encrypted TEE enclaves) during the active submission window to prevent idea theft and plagiarism. The evaluation of submissions can be handled by an AI for speed, objectivity, and scalability, especially when applying strict rubrics to many entries. However, humans should decide on the initial rubric creation, handle dispute resolutions, and maintain final override authority for nuanced or highly creative tasks that lack clear quantitative bounds.
