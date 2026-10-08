export type DemoEnvironment = {
  AA_DEMO_MODE?: string;
};

export function isAlgorithmicAccountabilityDemoMode(
  env: DemoEnvironment =
    process.env as DemoEnvironment,
): boolean {
  const value =
    env.AA_DEMO_MODE
      ?.trim()
      .toLowerCase();

  return (
    value === "true" ||
    value === "1" ||
    value === "yes" ||
    value === "on"
  );
}
