export async function unknownWrite(ctx: unknown) {
  await ctx.db.transmogrify("reports");
  const { db } = ctx;
  await db.insert("reports", {});
}
