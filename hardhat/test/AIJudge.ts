import { expect } from "chai";
import hre from "hardhat";
import { keccak256, encodePacked, toBytes } from "viem";

describe("AIJudge Commit-Reveal", function () {
  async function deployAIJudge() {
    const [owner, otherAccount] = await hre.viem.getWalletClients();
    const publicClient = await hre.viem.getPublicClient();

    const aiJudge = await hre.viem.deployContract("AIJudge", []);

    return { aiJudge, owner, otherAccount, publicClient };
  }

  it("Should allow commit and reveal", async function () {
    const { aiJudge, owner, otherAccount, publicClient } = await deployAIJudge();

    const blockNumber = await publicClient.getBlockNumber();
    const block = await publicClient.getBlock({ blockNumber });
    const deadline = block.timestamp + 10n; 
    
    await aiJudge.write.createBounty(["Test Bounty", "Rubric", deadline], {
        value: 100n,
    });
    const bountyId = 1n; // first bounty

    const answer = "My brilliant answer";
    const salt = "0x1234567890123456789012345678901234567890123456789012345678901234";

    const commitment = keccak256(
      encodePacked(
        ["string", "bytes32", "address", "uint256"],
        [answer, salt, otherAccount.account.address, bountyId]
      )
    );

    // Commit phase
    await aiJudge.write.submitCommitment([bountyId, commitment], { account: otherAccount.account });

    // Try to reveal early (should fail)
    await expect(aiJudge.write.revealAnswer([bountyId, answer, salt], { account: otherAccount.account })).to.be.rejectedWith("reveal phase not started");

    // Advance time past deadline
    await hre.network.provider.send("evm_setNextBlockTimestamp", [Number(deadline) + 1]);
    await hre.network.provider.send("evm_mine");

    // Try to commit late (should fail)
    await expect(aiJudge.write.submitCommitment([bountyId, commitment], { account: owner.account })).to.be.rejectedWith("submissions closed");

    // Reveal phase
    await aiJudge.write.revealAnswer([bountyId, answer, salt], { account: otherAccount.account });

    const submission = await aiJudge.read.getSubmission([bountyId, 0n]);
    expect(submission[0].toLowerCase()).to.equal(otherAccount.account.address.toLowerCase());
    expect(submission[1]).to.equal(answer);
  });
});
