import type { Stimulus } from "./schemas";

const image = (id: string, category: string, tags: string[]): Stimulus => ({
  id,
  modality: "image",
  src: `/stimuli/images/${id}.jpg`,
  category,
  tags,
});

export const STIMULI: Stimulus[] = [
  image("beach", "ビーチ", ["sea", "summer", "rest"]),
  image("train", "海沿いの線路", ["journey", "motion", "sea"]),
  image("old-cafe", "古い喫茶店", ["ritual", "quiet", "urban"]),
  image("pintxos-bar", "バルの小皿料理", ["food", "night", "friends"]),
  image("quiet-alleys", "静かな路地", ["urban", "solitude", "wandering"]),
  image("film-photography", "フィルム写真", ["analog", "creative", "friends"]),
  image("japanese-garden", "日本庭園", ["tradition", "nature", "quiet"]),
  image("camping", "キャンプ", ["outdoors", "friends", "nature"]),
];

export const STIMULUS_BY_ID = new Map(STIMULI.map((s) => [s.id, s]));
