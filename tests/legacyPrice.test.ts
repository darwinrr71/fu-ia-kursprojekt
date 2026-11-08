import { execFile } from "node:child_process";
import { calcPrice } from "../src/pricing/legacyPrice";

jest.mock("node:child_process", () => ({ execFile: jest.fn() }));

const execFileMock = execFile as unknown as jest.Mock;

beforeEach(() => {
  execFileMock.mockReset();
});

it("returnerar Python-processens JSON som ett lyckat prisresultat", async () => {
  execFileMock.mockImplementation((_file, _args, _options, callback) => {
    callback(null, '{"net":"950","vat":"237.5","total":"1187.5"}\n');
  });

  const result = await calcPrice(1042);

  expect(result).toEqual({
    ok: true,
    value: { net: "950", vat: "237.5", total: "1187.5" },
  });
  expect(execFileMock).toHaveBeenCalledWith(
    "python3",
    [expect.stringMatching(/price_calc\.py$/), "1042"],
    { env: process.env },
    expect.any(Function),
  );
});

it("översätter alla processfel till not_found", async () => {
  execFileMock.mockImplementation((_file, _args, _options, callback) => {
    callback(new Error("processfel"), "");
  });

  const result = await calcPrice(9999);

  expect(result).toEqual({
    ok: false,
    error: {
      code: "not_found",
      message: "Pris för beställning 9999 kunde inte räknas.",
    },
  });
});
