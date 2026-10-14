import { pinDice } from '@/game/seededRng';

// Tests and replay tapes pin dice through Math.random (spyOn / the replay's seeded stream); read engine dice from it.
pinDice(() => Math.random());
