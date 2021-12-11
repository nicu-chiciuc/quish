type BakeBrownies = { tag: "BAKE_BROWNIES"; quantity: number };
type EatBrownie = { tag: "EAT_BROWNIE" };
type Action = BakeBrownies | EatBrownie;

class BrownieCounter {
  brownieCount = 0;

  bakeBrownies(action: BakeBrownies): void {
    this.brownieCount += action.quantity;
  }

  eatBrownie(action: EatBrownie): void {
    if (this.brownieCount > 0) {
      console.log("Om nom nom");
      this.brownieCount -= 1;
    } else {
      console.log("Noooooo!");
    }
  }
}

function dispatchAction(brownieCounter: BrownieCounter, action: Action): void {
  switch (action.tag) {
    case "BAKE_BROWNIES":
      brownieCounter.bakeBrownies(action);
      break;
    case "EAT_BROWNIE":
      brownieCounter.eatBrownie(action);
      break;
  }
}

disp;
