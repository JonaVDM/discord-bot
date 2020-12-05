import { createSandbox, SinonSandbox } from "sinon";
import { expect } from "chai";
import { Message } from "discord.js";
import { BaseMocks } from "@lambocreeper/mock-discord.js";

import AdventofcodeCommand from "../../src/commands/AdventofcodeCommand";
import Command from "../../src/abstracts/Command";
import AdventOfCodeService from "../../src/services/AdventOfCodeService";
import { EMBED_COLOURS, ADVENT_OF_CODE_INVITE, ADVENT_OF_CODE_LEADERBOARD, ADVENT_OF_CODE_RESULTS_PER_PAGE } from "../../src/config.json";
import { AOCLeaderBoard } from "../../src/interfaces/AdventOfCode";

const AOCMockData: AOCLeaderBoard = {
	event: "2021",
	owner_id: "490120",
	members: {
		490120: {
			completion_day_level: {
				1: {
					1: {
						get_star_ts: "1606816563"
					}
				}
			},
			local_score: 26,
			global_score: 0,
			name: "Lambo",
			id: "490120",
			stars: 3,
			last_star_ts: "1606899444"
		}
	}
};

describe("Adventofcode Command", () => {
	describe("constructor", () => {
		it("creates a command called adventofcode", () => {
			const command = new AdventofcodeCommand();

			expect(command.getName()).to.equal("adventofcode");
			expect(command.getAliases().includes("aoc")).to.be.true;
		});

		it("creates a command with correct description", () => {
			const command = new AdventofcodeCommand();

			expect(command.getDescription()).to.equal("Shows the current leaderboard for adventofcode.");
		});
	});

	describe("run()", () => {
		let sandbox: SinonSandbox;
		let message: Message;
		let command: AdventofcodeCommand;
		let AOC: AdventOfCodeService;

		beforeEach(() => {
			sandbox = createSandbox();
			command = new AdventofcodeCommand();
			message = BaseMocks.getMessage();
			AOC = AdventOfCodeService.getInstance();
		});

		it("sends a message to the channel", async () => {
			const messageMock = sandbox.stub(message.channel, "send");

			sandbox.stub(AOC, "getLeaderBoard").resolves(AOCMockData);

			await command.run(message, []);

			expect(messageMock.calledOnce).to.be.true;
		});

		it("sends an error message when the year is too far into the feature", async () => {
			const messageMock = sandbox.stub(message.channel, "send");

			sandbox.stub(AOC, "getLeaderBoard").throws();
			sandbox.stub(command, "getYear").returns(2019);

			await command.run(message, ["2021"]);
			const embed = messageMock.getCall(0).firstArg.embed;

			expect(messageMock.calledOnce).to.be.true;
			expect(embed.title).to.equal("Error");
			expect(embed.description).to.equal("Year requested not available.\nPlease query a year between 2015 and 2019");
			expect(embed.hexColor).to.equal(EMBED_COLOURS.ERROR.toLowerCase());
		});

		it("sends an error message when the year is too far in the past", async () => {
			const messageMock = sandbox.stub(message.channel, "send");

			sandbox.stub(AOC, "getLeaderBoard").throws();
			sandbox.stub(command, "getYear").returns(2018);

			await command.run(message, ["2000"]);
			const embed = messageMock.getCall(0).firstArg.embed;

			expect(messageMock.calledOnce).to.be.true;
			expect(embed.title).to.equal("Error");
			expect(embed.description).to.equal("Year requested not available.\nPlease query a year between 2015 and 2018");
			expect(embed.hexColor).to.equal(EMBED_COLOURS.ERROR.toLowerCase());
		});

		it("should query the year 2018 from the AOC Service", async () => {
			const messageMock = sandbox.stub(message.channel, "send");
			const serviceMock = sandbox.stub(AOC, "getLeaderBoard").resolves({ members: {}, event: "2018", owner_id: "12345" });

			sandbox.stub(command, "getYear").returns(2020);

			await command.run(message, ["2018"]);

			expect(serviceMock.calledOnce).to.be.true;
			expect(serviceMock.getCall(0).args[1]).to.equal(2018);
			expect(messageMock.calledOnce).to.be.true;
		});

		it("sends a message with the current score", async () => {
			const messageMock = sandbox.stub(message.channel, "send");
			const year = new Date().getFullYear();

			sandbox.stub(AOC, "getLeaderBoard").resolves(AOCMockData);

			await command.run(message, []);

			const embed = messageMock.getCall(0).firstArg.embed;

			expect(messageMock.calledOnce).to.be.true;
			expect(embed.title).to.equal("Advent Of Code");
			expect(embed.description).to.equal(`Leaderboard ID: \`${ADVENT_OF_CODE_INVITE}\`\n\n[View Leaderboard](https://adventofcode.com/${year}/leaderboard/private/view/${ADVENT_OF_CODE_LEADERBOARD})`);
			expect(embed.fields[0].name).to.equal(`Top ${ADVENT_OF_CODE_RESULTS_PER_PAGE}`);
			expect(embed.fields[0].value).to.equal("```java\n(Name, Stars, Points)\n 1) Lambo | 3 | 26\n```");
			expect(embed.hexColor).to.equal(EMBED_COLOURS.SUCCESS.toLowerCase());
		});

		it("gives an error when the wrong acces token/id is provided", async () => {
			const messageMock = sandbox.stub(message.channel, "send");

			sandbox.stub(AOC, "getLeaderBoard").throws();

			await command.run(message, []);

			const embed = messageMock.getCall(0).firstArg.embed;

			expect(messageMock.calledOnce).to.be.true;
			expect(embed.title).to.equal("Error");
			expect(embed.description).to.equal("Could not get the leaderboard for Advent Of Code.");
			expect(embed.hexColor).to.equal(EMBED_COLOURS.ERROR.toLowerCase());
		});

		afterEach(() => {
			sandbox.restore();
		});
	});
});
