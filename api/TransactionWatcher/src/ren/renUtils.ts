
export const parseV2Selector = (selector: string) => {
  const maybeClaimFees = /(.*)\/claimFees/.exec(selector);
  if (maybeClaimFees) {
    const asset = maybeClaimFees[1];
    return {
      asset,
      from: "RenVM",
      to: asset,
    };
  }
  const regex =
    /^([a-zA-Z_]+)\/(?:(?:(?:from([a-zA-Z]+?(?=_to)))_(?:to([a-zA-Z]+))?)|(?:from([a-zA-Z]+))|(?:to([a-zA-Z]+)))$/;
  const match = regex.exec(selector);
  if (!match) {
    throw new Error(`Invalid selector format '${selector}'.`);
  }
  const [, asset, burnAndMintFrom, burnAndMintTo, burnFrom, mintTo] = match;

  return {
    asset,
    from: burnAndMintFrom || burnFrom || asset,
    to: burnAndMintTo || mintTo || asset,
  };
};
