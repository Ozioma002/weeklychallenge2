"reach 0.1";
const shared = {
  countDownTime: Fun([UInt], Null),
  showOutcome: Fun([Bool], Null),
};
const amt = 5000000000;
export const main = Reach.App(() => {
  const A = Participant("Alice", {
    // Specify Alice's interact interface here
    activateSwitch: Fun([], Bool),
    ready:Fun([],Null),
    ...shared,
  });
  const B = Participant("Bob", {
    // Specify Bob's interact interface here
    acceptTerms: Fun([], Bool),
    ...shared,
  });

  // Application initialization
  init();
  const count = 20;
  const informTimeout = () => {
    each([A, B], () => {
      interact.countDownTime(count);
    });
  };

  A.publish().pay(amt);
  // commit();
  A.interact.ready()
  commit();

  B.only(() => {
    const contractTerms = declassify(interact.acceptTerms());
  });
  B.publish(contractTerms).timeout(relativeTime(count), () =>
    closeTo(A, informTimeout)
  );

  var [countTime, isSwitchTrue] = [count + lastConsensusTime(), false];
  invariant(balance() == amt);
  while (lastConsensusTime() < countTime) {
    commit();
    A.only(() => {
      const endContract = !declassify(interact.activateSwitch());
    });
    A.publish(endContract).timeout(relativeTime(count), () =>
      closeTo(B, informTimeout)
    );
    each([B, A], () => {
      interact.showOutcome(endContract);
    });
    const contractFate = endContract
      ? lastConsensusTime()
      : count + lastConsensusTime();

    [countTime, isSwitchTrue] = [contractFate, endContract];
    continue;
  }

  transfer(balance()).to(!isSwitchTrue ? A : B);
  commit();

  // write your program here
  exit();
});
