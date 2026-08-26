# Public Research Notes — Tone Dimensions and Evaluation

## VERIFIED findings

1. Nielsen Norman Group defines four tone-of-voice spectra: **formal–casual, serious–funny, respectful–irreverent, and matter-of-fact–enthusiastic**. It treats tone as separable from the underlying message and demonstrates that the same factual message can be rendered in several tones. Source: [The Four Dimensions of Tone of Voice](https://www.nngroup.com/articles/tone-of-voice-dimensions/).
2. NN/g recommends emphasizing tonal qualities without allowing them to dominate content, defining anti-tone words, adapting tone to user emotion and topic, and validating tone with representative users. Source: [The Four Dimensions of Tone of Voice](https://www.nngroup.com/articles/tone-of-voice-dimensions/).
3. NN/g’s paired-sample studies kept presentation, topic, context, and details nearly identical while changing tone. This is a useful precedent for SynapticGM’s proposed **render-equivalence** fixtures: facts remain fixed while wording changes. Source: [The Impact of Tone of Voice on Users’ Brand Perception](https://www.nngroup.com/articles/tone-voice-users/).
4. NN/g reports that tone variations have measurable effects on perceived friendliness, trustworthiness, and desirability; humor can undermine trust in serious contexts and should not obstruct the information users need. Source: [The Impact of Tone of Voice on Users’ Brand Perception](https://www.nngroup.com/articles/tone-voice-users/).
5. NN/g recommends a compact set of target and anti-tone words, then qualitative and quantitative evaluation with users rather than relying on internal intuition. Source: [Tone-of-Voice Words](https://www.nngroup.com/articles/tone-voice-words/).

## SynapticGM application

The requested four axes can be operationalized as integer values from **−2 to +2** without implying psychometric precision: `formal↔casual`, `serious↔funny`, `respectful↔irreverent`, and `matter_of_fact↔enthusiastic`. For implementation fixtures, the ledger scene, SceneManifest, and permitted outcome remain byte-equivalent while render strings vary by profile. Humor is hard-gated off for death confirmation, safety repair, failed purchase, account/consent prompts, Kid Mode jeopardy, and any moment when levity could hide a mechanical consequence.

## Citation-ready references

[1]: https://www.nngroup.com/articles/tone-of-voice-dimensions/ "The Four Dimensions of Tone of Voice — Nielsen Norman Group"
[2]: https://www.nngroup.com/articles/tone-voice-users/ "The Impact of Tone of Voice on Users' Brand Perception — Nielsen Norman Group"
[3]: https://www.nngroup.com/articles/tone-voice-words/ "Tone-of-Voice Words — Nielsen Norman Group"
