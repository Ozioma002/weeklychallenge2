import { loadStdlib, ask } from "@reach-sh/stdlib";
import * as backend from "./build/index.main.mjs";

if (
  process.argv.length < 3 ||
  ["Deployer", "Attacher"].includes(process.argv[2]) == false
) {
  console.log("Usage: reach run index [Deployer|Attacher]");
  process.exit(0);
}
const role = process.argv[2];
console.log(`Your role is ${role}`);

const stdlib = loadStdlib(process.env);

const startingBalance = (amt = 100) => stdlib.parseCurrency(amt);

const showBalance = async (acc) => {
  console.log(
    `You balance as ${role} is`,
    stdlib.formatCurrency(await stdlib.balanceOf(acc))
  );
};
const shared = {
  countDownTime: (count) => {
    console.log("Timeout was encountered", parseInt(count));
  },
  showOutcome: (outcome) => {
    console.log(
      `Inheritance is with ${
        outcome
          ? "Attacher" == role
            ? "You"
            : "Attacher"
          : "Deployer" == role
          ? "You"
          : "Deployer"
      }`
    );
  },
};

if (role == "Deployer") {
  const acc = await stdlib.newTestAccount(startingBalance(6000));
  showBalance(acc);
  const ctc = acc.contract(backend);
  console.log("hello");
  // console.log(await ctc.getInfo())
  try {
    await Promise.all([
      backend.Alice(ctc, {
        ready: async () => {
          console.log(`Contract info: ${JSON.stringify(await ctc.getInfo())}`);
        },
        activateSwitch: async () => {
          const response = await ask.ask("Are you still Alive", ask.yesno);
          console.log(response);
          console.log(`${response ? "Yes i am still here" : "Nah"}`);
          return response;
        },
        ...shared,
      }),
    ]);
  } catch (error) {
    console.log(error);
  }
  ask.done();
  await showBalance(acc);
} else {
  const acc = await stdlib.newTestAccount(startingBalance(100));
  showBalance(acc);
  const info = await ask.ask("Paste contract info:", (s) => JSON.parse(s));
  const ctc = acc.contract(backend, info);
  try {
    await Promise.all([
      backend.Bob(ctc, {
        acceptTerms: async () => {
          const response = await ask.ask("Do you accept the terms", ask.yesno);
          console.log(response);
          console.log(`${response ? "Yes i accept" : "Nah"}`);
          return response;
        },
        ...shared,
      }),
    ]);
  } catch (error) {
    console.log(error);
  }
  await showBalance(acc);
  ask.done();
}

console.log("Goodbye,", role);
