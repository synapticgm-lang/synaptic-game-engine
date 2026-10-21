# PYOA Umbra Protocol: Gemini review verification and fixes (21 Oct 2026)

- **Branch:** `pyoa-umbra-fixes` (worktree `sgm-t100-r`, from z5 0e891d46). Not committed, pushed or deployed.
- **Source of truth:** `src/data/pyoa/umbraBook.json`. This is what the game serves; the research page files under docs/research/pyoa-maps are not in git.
- **Fix script:** `.tmp-pyoa/pyoa-umbra-fix.cjs`. Every replacement must match exactly once. The prose was written by hand; no AI was used.

## Gemini claims: verified

| Claim | Verdict | Notes |
|---|---|---|
| up-l-alone-36 truncated / no exits | **FALSE** | Complete page with 2 exits (Take the contents / Leave them and just take the map). |
| up-w-vault-35 missing target | **FALSE** | The page exists and is linked from up-w-vault-34. There are 0 missing targets in the book. |
| up-l-last-37 / up-l-last-39 orphans | **FALSE** | Linked from up-l-last-36 and up-l-last-37. There are 0 orphans in the book. |
| "Label -> up-w-faction-summons" on up-w-house-43 | **TRUE** | Fixed. |
| Stray `</user_query>` on up-r-bid-room, up-l-alone-13, up-r-perch-70 | **TRUE** | A full scan found 3 more (up-end-sold-knife, up-w-vault-104, up-r-bid-75). All 6 were cleaned. No other tags, placeholders or ids were found in prose. |
| Signet offered without taking it (up-w-recognizer, up-r-turnkey-knows) | **TRUE** | The only grant is up-bell-body "Lift the signet". The same problem was also found on up-l-deacon-knows, up-l-press-yard, up-l-forger-desk and up-r-bid-05. |
| Weapon while unarmed: up-r-bid-17, up-r-bid-56, up-r-hunt-11 | **TRUE** | Page 1 says "entirely unarmed" and **no page in the book grants a weapon**. 23 more uses were found (knife, blade, prybar, dagger, sidearm, holster, barrel, weapon), and all are fixed. |
| Weapon on up-r-pigeon-intercept | **FALSE** | That page uses no weapon. |
| Letters on up-w-house-64 via up-w-gutter-run | **TRUE** | Its only route in never finds letters. |
| Explosion on up-w-house-62 via up-w-house-40 | **TRUE** | It has 2 routes in, and only the one from up-w-house-35 has the blast. |
| Cloak on up-l-deacon-knows after porter livery | **TRUE** | It's reachable from the livery, tailor and cloak routes. |
| "Carry the pages to the press" leads to the burn ending | **FALSE (label unclear)** | Story 1 picked press, then at up-w-press-run chose "Pull the plates, take the ledge", which leads to the brazier. The label now says so. |
| Ending names a faction the player never chose (Story 3) | **TRUE** | up-end-sold-knife and up-end-sold-seat both said "magistrates". Both final choices offer silk or foundry, so the wording is now neutral. |
| "up-end-ghost-unused" name | **TRUE (internal)** | The id is not referenced in code. Renamed to `up-end-ghost-road`, with all 4 exits retargeted. |

## Approach
Items now follow one rule: **a page may only assume an item if every route into it grants that item.** Otherwise the item is either found on that page (letter-opener, slate, hinge pin, bent nail) or the action uses none at all (boot, fists, a whispered promise). Uses of the Archbishop's cloak became recognition of your face.

One extra fix: up-r-bid-27 had modern tech ("communication terminal", "millions of credits"), now a brass telegraph key and gold.

## Graph check after the fixes
- 999 pages, all 999 reachable from up-bell-tower.
- 0 missing targets, 0 dead ends.
- 8 of 8 endings reachable.
- 0 markup or "Label" leaks.
- Weapon-assumption scan: 0.

Test: `playtest15aUmbraCompile.test.ts` passes 6 of 7. The 1 failure is a stale build-stamp check (it expects 2026-10-16d) and has nothing to do with the book.

## Left for John
- **Many choices lead to the same page** (for example 3 cover options all go to up-w-recognizer, and both buyer choices go to one ending). That's a design choice, not a broken page, so I left it alone.
- **up-r-bid-27 still mentions a magistrate's signet ring**, which is fine: it belongs to the dead magistrate. The cloaks on up-l-harbor-statue and up-r-bid-35 refer to your own coat, the Night-Crow ulster from page 1.
- **Story 3 jumps back to the Exchange roof after the escape** (up-w-harbor-crown, then "Take the night stair off the crown", then the up-w-night lane). The night lane rejoins the endgame by design, so I left it as written. You decide whether that exit should exist.

## Every change (52)
| Page | Kind | Why | Before | After |
|---|---|---|---|---|
| up-r-bid-room | markup | stray </user_query> tag | </user_query> | (removed) |
| up-end-sold-knife | markup | stray </user_query> tag | </user_query> | (removed) |
| up-l-alone-13 | markup | stray </user_query> tag | </user_query> | (removed) |
| up-r-perch-70 | markup | stray </user_query> tag | </user_query> | (removed) |
| up-w-vault-104 | markup | stray </user_query> tag | </user_query> | (removed) |
| up-r-bid-75 | markup | stray </user_query> tag | </user_query> | (removed) |
| up-w-house-43 | exit | placeholder exit label | Label | Answer the faction summons |
| up-end-ghost-unused | rename | internal "unused" ending id | up-end-ghost-unused | up-end-ghost-road |
| up-end-sold-knife | prose | ending named a buyer (magistrates) neither final choice offered | The magistrates paid handsomely for the return of the protocol | The house you chose paid handsomely for the protocol |
| up-end-sold-seat | prose | ending named a buyer (magistrates) neither final choice offered | Handing the ledger back to the magistrates earned you | Handing the ledger to the house you chose earned you |
| up-w-press-run | exit | label did not say it leads to the burn route | Pull the plates, take the ledge | Pull the plates and carry them to the brazier ledge |
| up-w-recognizer | exit | signet assumed; most routes never take it | Buy his silence with the signet | Buy his silence with a whispered promise |
| up-l-deacon-knows | exit | signet assumed; most routes never take it | Buy his silence with the signet | Buy his silence with a whispered promise |
| up-r-turnkey-knows | exit | signet assumed; most routes never take it | Buy his silence with the signet | Buy his silence with a whispered promise |
| up-r-turnkey-knows | prose | signet assumed | You have the Archbishop's signet to buy his corrupt silence, or the physical leverage | You could buy his corrupt silence with a whispered promise, or use the physical leverage |
| up-l-press-yard | prose | signet assumed | type case open, signet in your pocket, | type case open, the ledger heavy in your coat, |
| up-l-forger-desk | prose | signet assumed | You press his stolen signet into the hot wax | You press the ledger's own brass clasp-seal into the hot wax |
| up-l-forger-desk | exit | signet assumed | Seal the forged leaf with his signet | Seal the forged leaf with the ledger's clasp |
| up-r-bid-05 | prose | signet assumed as yours | The terms specify that your signet ring must be delivered | The terms specify that the Archbishop's ledger must be delivered |
| up-l-deacon-knows | prose | cloak assumed after livery/tailor routes | He knows instantly that the garment is on the wrong shoulders, | He knows instantly that he saw you in the belfry, whatever you are wearing now, |
| up-w-house-64 | prose | letters never found on the only route in (gutter-run) | clutching the incriminating letters tightly against your chest | clutching the ledger tightly against your chest |
| up-w-house-62 | prose | explosion assumed; route from house-40 has none | You tear down the main staircase, the shockwave of the blast still ringing in your ears. Smoke begins to billow out from the second floor, triggering the manor's alarm bells. | You tear down the main staircase as the manor erupts into chaos behind you. Shouts carry from the second floor, and the alarm bells begin to clang. |
| up-w-house-62 | prose | explosion assumed | responding to the explosion to notice | responding to the uproar upstairs to notice |
| up-w-loft-34 | prose | weapon assumed | with the pommel of your knife | with the heel of your boot |
| up-w-loft-41 | prose | weapon assumed | from the drone's logic board with your blade | from the drone's logic board with a bent screwdriver off the workbench |
| up-w-loft-48 | prose | weapon assumed | with the butt of your knife | with a loose cobblestone |
| up-w-house-34 | prose | weapon assumed | You carefully wedge your blade into the copper mechanism | You snatch a brass letter-opener from the desk and wedge it into the copper mechanism |
| up-w-house-34 | prose | weapon assumed | grinding against your knife | grinding against the thin brass |
| up-w-night-05 | prose | weapon assumed | Your prybar snaps the aged lead lining | A loose iron bar from the scaffold snaps the aged lead lining |
| up-w-night-61 | prose | weapon assumed | You slowly push the lid open, drawing your weapon. | You slowly push the lid open, every muscle coiled to run. |
| up-r-hunt-05 | exit | firearm assumed | Fire a blind suppression shot at the tower | Hurl a slate at the tower to draw her fire |
| up-r-hunt-11 | prose | firearm assumed | You pull your weapon and fire twice at the shifting shadow, the muzzle flash blinding you for a split second in the gloom. The shots crack loudly against the stone | You tear a loose slate free and hurl it at the shifting shadow, then a second, ducking low in the gloom. The slates crack loudly against the stone |
| up-r-hunt-11 | prose | firearm assumed | Now she knows exactly what caliber you are carrying and where you are pinned. | Now she knows you are unarmed, and exactly where you are pinned. |
| up-r-hunt-10 | prose | firearm assumed | You draw your sidearm, sweeping the corners | You keep low, sweeping the corners with your eyes |
| up-r-hunt-15 | prose | firearm assumed | your hand hovering near your holster | your hand trailing the cold wall |
| up-r-hunt-16 | prose | firearm assumed | You use the barrel of your weapon to carefully hook the strap | You work a bent length of wire from the grate to carefully hook the strap |
| up-r-hunt-17 | prose | weapon assumed | with your weapon raised | with your fists raised |
| up-r-hunt-30 | prose | firearm assumed | You raise your weapon, resting the barrel on a brass rail to steady your aim in the dark. | You close your hand around a heavy brass inkwell from the nearest desk, weighing the throw in the dark. |
| up-r-hunt-30 | exit | firearm assumed | Take a shot at the reflection | Hurl the inkwell at the reflection |
| up-r-hunt-35 | prose | gear assumed, off-tone | pulling a spool of fine monofilament wire from your tactical belt | unwinding a length of fine brass wire from a broken bell-pull |
| up-r-hunt-35 | prose | weapon assumed | you draw your weapon and wait in the shadows of the doorway | you press yourself into the shadows of the doorway and wait |
| up-r-hunt-40 | exit | firearm assumed | Draw your weapon and fire into the light | Rush the catwalk while she is blind |
| up-r-bid-11 | prose | weapon assumed | You draw your weapon and step into the steam vent. | You pull your collar high and step into the steam vent. |
| up-r-bid-17 | prose | weapon assumed | You carefully slide your blade under the lowest tripwire | You carefully slide a sliver of broken slate under the lowest tripwire |
| up-r-bid-24 | prose | weapon assumed | your weapon drawn and leveled at the cloaked figure | your hands empty and your eyes fixed on the cloaked figure |
| up-r-bid-28 | prose | weapon assumed | You check your weapon and prepare for the next phase. | You flex your bruised hands and prepare for the next phase. |
| up-r-bid-56 | prose | weapon assumed | You jam your dagger into the gap | You jam a loose iron hinge pin into the gap |
| up-r-bid-64 | prose | weapon assumed | with the hilt of your dagger | with your coat-wrapped elbow |
| up-l-under-11 | prose | weapon assumed | Prying it open with your knife | Prying it open with a bent nail from the soot-black frame |
| up-l-under-14 | prose | weapon assumed | You jam your blade into the mechanism | You jam the bent nail into the mechanism |
| up-r-bid-27 | prose | off-tone (modern tech) | slumped over a communication terminal | slumped over a brass telegraph key |
| up-r-bid-27 | prose | off-tone (modern tech) | The screen flickers, displaying a finalized transaction routing millions of credits to an untraceable offshore account. | The paper tape still curls from the machine, recording a transfer of a fortune in gold to an untraceable foreign house. |


## Round 2 (2026-10-21, hand edits, no AI, uncommitted)

- up-r-bid-64: prose present in source and export; no fix needed. Short-page scan: none empty; shortest up-r-perch-66 (236 chars), up-r-perch-65 (239).
- 101 changes: 91 generic exit labels rewritten to name destinations, 3 anchor-line rewrites, 7 flash-powder variations.
- Graph check: 999/999 reachable, 0 missing targets, 0 dead ends, 8/8 endings, 0 generic labels left.
- Book test: 6/7 pass; 1 stale stamp check fails (unrelated).

| # | page | field | before | after |
|---|---|---|---|---|
| 1 | up-w-loft-18 | exit | Leave this room | Climb away from the patrol to the Exchange roofs |
| 2 | up-w-loft-26 | exit | Keep going | Squeeze down between the wall and the refuse bins |
| 3 | up-w-loft-44 | exit | Leave this room | Slip out into the alley behind the lamp-yard |
| 4 | up-w-loft-48 | exit | Turn back | Back out to the alley behind the lamp-yard |
| 5 | up-w-vault-26 | exit | Leave this room | Get clear of the footsteps, up to the Exchange roofs |
| 6 | up-w-house-36 | exit | Leave this room | Duck the boots and climb to the Exchange roofs |
| 7 | up-w-house-62 | exit | Leave this room | Skip the streets and climb to the Exchange roofs |
| 8 | up-w-night-05 | exit | Leave this room | Slip back out to the Exchange roofs |
| 9 | up-w-night-08 | exit | Leave this room | Climb out to the Exchange roofs instead |
| 10 | up-w-night-15 | exit | Leave this room | Climb from the wagon to the Exchange roofs |
| 11 | up-w-night-15 | exit | Keep going | Cut through to the ink storage vats |
| 12 | up-w-night-29 | exit | Keep going | Hide in a loose crate |
| 13 | up-w-night-31 | exit | Keep going | Climb to the catwalks over the ink reservoirs |
| 14 | up-w-night-48 | exit | Leave this room | Abandon the dial and climb to the Exchange roofs |
| 15 | up-w-night-59 | exit | Keep going | Crawl back into the wagon crate |
| 16 | up-w-night-62 | exit | Keep going | Melt into the shadows by the steel door |
| 17 | up-l-last-02 | exit | Keep going | Walk inland into the city streets |
| 18 | up-l-last-10 | exit | Keep going | Cross to the courtyard behind the press |
| 19 | up-l-last-14 | exit | Keep going | Approach the base of the brass colossus |
| 20 | up-l-last-17 | exit | Keep going | Wade into the flooded dock cellar |
| 21 | up-l-last-18 | exit | Keep going | Return to the forge |
| 22 | up-l-last-19 | exit | Keep going | Go down to the empty room beneath the Exchange |
| 23 | up-l-last-20 | exit | Keep going | Walk the high ledges of the Exchange |
| 24 | up-l-last-21 | exit | Keep going | Take the vault corridor |
| 25 | up-l-last-23 | exit | Keep going | Go back to the press room |
| 26 | up-l-last-24 | exit | Keep going | Make for the brass colossus |
| 27 | up-l-last-25 | exit | Keep going | Open the buyer's lockbox |
| 28 | up-l-last-26 | exit | Keep going | Study the barge manifest |
| 29 | up-l-last-28 | exit | Keep going | Stop in the shadow of the Veridia tower |
| 30 | up-l-last-29 | exit | Keep going | Keep to the rain-slick Exchange slates |
| 31 | up-l-last-30 | exit | Keep going | Return to the forge and snuff the coals |
| 32 | up-l-last-32 | exit | Keep going | Put the type case back in its cabinet |
| 33 | up-l-last-34 | exit | Keep going | Climb down into the flooded dock cellar |
| 34 | up-r-hunt-22 | exit | Leave this room | Lose her in the crowd, up to the Exchange parapet |
| 35 | up-r-hunt-24 | exit | Leave this room | Cross to the Exchange parapet |
| 36 | up-r-hunt-25 | exit | Leave this room | Slip away to the Exchange parapet |
| 37 | up-r-hunt-26 | exit | Leave this room | Skip the footprints and climb to the Exchange parapet |
| 38 | up-r-hunt-27 | exit | Leave this room | Climb back up to the Exchange parapet |
| 39 | up-r-hunt-28 | exit | Leave this room | Let her go and climb to the Exchange parapet |
| 40 | up-r-hunt-29 | exit | Leave this room | Leave the warrant and climb to the Exchange parapet |
| 41 | up-r-hunt-30 | exit | Leave this room | Drop the inkwell and slip up to the Exchange parapet |
| 42 | up-r-hunt-32 | exit | Leave this room | Ignore the invitation and climb to the Exchange parapet |
| 43 | up-r-hunt-33 | exit | Leave this room | Take the corridor up to the Exchange parapet |
| 44 | up-r-hunt-35 | exit | Leave this room | Abandon the ambush and climb to the Exchange parapet |
| 45 | up-r-hunt-36 | exit | Leave this room | Leave the paper and climb to the Exchange parapet |
| 46 | up-r-hunt-37 | exit | Leave this room | Ignore the signal and climb to the Exchange parapet |
| 47 | up-r-hunt-38 | exit | Leave this room | Take the long way round to the Exchange parapet |
| 48 | up-r-hunt-39 | exit | Leave this room | Back off the catwalk to the Exchange parapet |
| 49 | up-r-hunt-40 | exit | Leave this room | Flee the theatre for the Exchange parapet |
| 50 | up-r-hunt-42 | exit | Leave this room | Leave him bound and climb to the Exchange parapet |
| 51 | up-l-hem-12 | exit | Leave this room | Slip out onto the lamplit street |
| 52 | up-l-hem-21 | exit | Leave this room | Roll out onto the lamplit street |
| 53 | up-l-hem-38 | exit | Keep going | Ride on in the dark |
| 54 | up-l-hem-39 | exit | Leave this room | Climb out onto the lamplit street instead |
| 55 | up-l-hem-58 | exit | Leave this room | Run for the lamplit street |
| 56 | up-l-hem-65 | exit | Leave this room | Make straight for the last choice |
| 57 | up-l-hem-69 | exit | Keep going | Stay hidden in the cart |
| 58 | up-l-under-14 | exit | Leave this room | Back out to the lamplit street |
| 59 | up-l-under-20 | exit | Keep going | Search the floor by the blind player's chair |
| 60 | up-l-under-21 | exit | Keep going | Wipe the chalked names off the slate |
| 61 | up-l-under-22 | exit | Keep going | Retreat deeper into the undercroft |
| 62 | up-r-bolt-29 | exit | Leave this room | Skip the wagons and head for the Exchange parapet |
| 63 | up-r-bolt-31 | exit | Leave this room | Feel your way through the tunnel to the Exchange parapet |
| 64 | up-r-bolt-38 | exit | Leave this room | Vault the fence and head for the Exchange parapet |
| 65 | up-r-bolt-44 | exit | Leave this room | Leave the theatre for the Exchange parapet |
| 66 | up-r-bolt-50 | exit | Leave this room | Climb from the beams to the Exchange parapet |
| 67 | up-r-bolt-58 | exit | Leave this room | Cross the market to the Exchange parapet |
| 68 | up-r-bolt-60 | exit | Keep going | Plunge into the dark tunnel |
| 69 | up-r-bolt-61 | exit | Leave this room | Follow the tunnel up to the Exchange parapet |
| 70 | up-r-bolt-67 | exit | Leave this room | Leave the feast and head for the Exchange parapet |
| 71 | up-l-alone-11 | exit | Keep going | Skirt the industrial sector |
| 72 | up-l-alone-12 | exit | Keep going | Climb the bedrock path to the ridgeline |
| 73 | up-r-perch-45 | exit | Leave this room | Let the shadow pass, then slip to the Exchange parapet |
| 74 | up-l-alone-33 | exit | Leave this room | Drop from the rooftop to the lamplit street |
| 75 | up-l-alone-48 | exit | Keep going | Hide behind the chimney stack |
| 76 | up-l-alone-71 | exit | Keep going | Cut through the dripping alley |
| 77 | up-l-alone-92 | exit | Keep going | Keep up the pace through the winding streets |
| 78 | up-l-alone-93 | exit | Turn back | Double back to the faction letters |
| 79 | up-l-last-40 | exit | Leave this room | Skip the gate and slip out to the lamplit street |
| 80 | up-l-last-43 | exit | Keep going | Hide behind the paper bales |
| 81 | up-l-last-48 | exit | Keep going | Step out onto the cobbled street |
| 82 | up-l-last-56 | exit | Keep going | Slip into the dark alleys |
| 83 | up-l-last-69 | exit | Keep going | Walk on toward the opera house |
| 84 | up-l-last-84 | exit | Leave the room | Shut the door on the wax and ink |
| 85 | up-l-last-84 | exit | Keep going | Turn down a side street off the opera plaza |
| 86 | up-l-last-97 | exit | Keep going | Turn inland, away from the harbor |
| 87 | up-l-last-101 | exit | Keep going | Execute the forgery here and now |
| 88 | up-w-vault-80 | exit | Leave this room | Head up to the Exchange roofs before the patrols arrive |
| 89 | up-w-vault-84 | exit | Leave this room | Leave the gaslights and climb to the Exchange roofs |
| 90 | up-w-vault-92 | exit | Leave this room | Turn away from the vault, up to the Exchange roofs |
| 91 | up-r-bid-64 | exit | Leave this room | Get out of the vault, up to the Exchange parapet |
| 92 | up-w-final-choice | prose | The heavy ledger feels like an anchor as you prepare to make your final decision. | The ledger sits cold against your ribs, and every road from this apex ends somewhere you cannot walk back from. |
| 93 | up-l-solo-final | prose | The heavy, brass-bound ledger feels like an anchor dragging you toward a permanent decision. | Alone, with nobody to argue you out of it, you feel the ledger's brass corners bite through your coat as you choose. |
| 94 | up-r-rival-final | prose | The heavy, brass-bound ledger feels like an anchor as you prepare to run. | You hug the ledger to your chest like a shield she can shoot straight through, and gather yourself to run. |
| 95 | up-w-night-06 | prose | looks out over the flash-powder streets, where smog gathers | looks out over the powder district, where smog gathers |
| 96 | up-w-night-22 | prose | toward the flash-powder streets. | toward the smog-choked lanes of the powder district. |
| 97 | up-w-night-35 | prose | Below you, the flash-powder streets are a maze | Below you, the powder district is a maze |
| 98 | up-w-night-45 | prose | looking down at the flash-powder streets. | looking down at the pale, sulphur-dusted lanes below. |
| 99 | up-w-night-53 | prose | through the flash-powder streets. | through the powder district's smog. |
| 100 | up-l-alone-16 | prose | This flash-powder street crackles faintly under your boots | The pale grit of this street crackles faintly under your boots |
| 101 | up-l-alone-61 | prose | stepping back onto the pale flash-powder street. | stepping back onto the pale, gritty street. |
