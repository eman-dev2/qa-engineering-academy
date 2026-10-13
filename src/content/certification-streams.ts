/** ISTQB portfolio streams, in display order (official names; translations live in the dictionaries). */
export const certificationStreams = [
  "Core Foundation",
  "Core Advanced",
  "Specialist: Technologies and Approaches",
  "Specialist: Quality Characteristics & Test Levels",
  "Specialist: Testing in Particular Domains",
  "Expert Level",
] as const;

export type CertificationStream = (typeof certificationStreams)[number];
