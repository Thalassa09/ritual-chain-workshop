# Implementation Plan: Commit-Reveal Bounty

## 1. Smart Contract Changes (`AIJudge.sol`)
**Objective**: Hide submissions until judging phase starts to prevent copying.

**Data Structures**:
- Add a mapping for commitments: `mapping(uint256 => mapping(address => bytes32)) public commitments;`
- Add a mapping to track if a user has committed: `mapping(uint256 => mapping(address => bool)) public hasCommitted;`
- Add a mapping to track if a user has revealed: `mapping(uint256 => mapping(address => bool)) public hasRevealed;`
- Add `commitmentsCount` to `Bounty` struct.
- Leave `Submission` struct as is (stores the revealed answers for AI judging).

**Functions to Add/Modify**:
1. `submitCommitment(uint256 bountyId, bytes32 commitment)`
   - Checks: `block.timestamp <= bounty.deadline`, not judged.
   - Checks: `!hasCommitted[bountyId][msg.sender]`
   - Checks: `bounty.commitmentsCount < MAX_SUBMISSIONS`
   - Store commitment, set `hasCommitted = true`, increment `commitmentsCount`.
   - Emits `CommitmentSubmitted`.

2. `revealAnswer(uint256 bountyId, string calldata answer, bytes32 salt)`
   - Checks: `block.timestamp > bounty.deadline`, not judged.
   - Checks: `hasCommitted[bountyId][msg.sender]` and `!hasRevealed[bountyId][msg.sender]`
   - Computes: `keccak256(abi.encodePacked(answer, salt, msg.sender, bountyId))`
   - Verifies hash == stored commitment.
   - Set `hasRevealed = true`.
   - Pushes to `bounty.submissions`.
   - Emits `AnswerRevealed`.

3. `submitAnswer` (Existing)
   - Delete this function.

4. `judgeAll`
   - Only allow judging if `block.timestamp > bounty.deadline` and at least one submission has been revealed.

## 2. Documentation Updates
- Update `README.md` with Architecture Note, Test Plan, and Reflection Question.
