/**
 * Deleting rounds, in one place so every screen says and does the same thing.
 * - Discard (in progress): your card plus any cards you're keeping for friends. Friends scoring on their own phones
 *   keep theirs.
 * - Delete (finished): your round only; stats, handicap and anything it earned are recalculated without it.
 */
import { ActionSheet } from '@/components/ui';
import { isScramble } from '@/domain/teams';
import { roundOwner, type Round } from '@/domain/types';
import { useAppData } from '@/state/app-data';

type Data = ReturnType<typeof useAppData>;

/** The cards discarding this round removes: yours (or one you keep) and the friends' cards you're keeping. */
export function discardTargets(data: Data, round: Round): Round[] {
  const me = data.me.id;
  const mine = roundOwner(round) === me || round.scoredBy === me ? [round] : [];
  const kept = data.roundGroup(round).filter((r) => r.id !== round.id && r.scoredBy === me && r.status === 'active');
  return [...mine, ...kept];
}

const firstNames = (data: Data, rounds: Round[]) =>
  rounds.map((r) => (isScramble(r) ? 'the other team' : data.playerById(roundOwner(r))?.name.split(' ')[0] ?? 'a friend'));

export function DiscardRoundSheet({ round, visible, onClose, onDone }: { round: Round; visible: boolean; onClose: () => void; onDone: () => void }) {
  const data = useAppData();
  const targets = discardTargets(data, round);
  const kept = targets.filter((r) => r.id !== round.id);
  const ownPhones = data.roundGroup(round).filter((r) => r.id !== round.id && !targets.includes(r) && r.status === 'active');
  const body = [
    'Scores entered so far will be deleted. This can’t be undone.',
    kept.length ? `The cards you’re keeping for ${firstNames(data, kept).join(', ')} are discarded too.` : '',
    ownPhones.length ? `${firstNames(data, ownPhones).join(', ')} ${ownPhones.length === 1 ? 'keeps their' : 'keep their'} own card.` : '',
  ].filter(Boolean).join(' ');
  return (
    <ActionSheet
      visible={visible}
      title="Discard this round?"
      body={body}
      onClose={onClose}
      actions={[{
        label: 'Discard round',
        icon: 'trash',
        destructive: true,
        onPress: async () => {
          for (const r of targets) await data.deleteRound(r.id);
          onDone();
        },
      }]}
    />
  );
}

export function DeleteRoundSheet({ round, visible, onClose, onDone }: { round: Round; visible: boolean; onClose: () => void; onDone: () => void }) {
  const data = useAppData();
  const scramble = isScramble(round);
  return (
    <ActionSheet
      visible={visible}
      title="Delete this round?"
      body={scramble
        ? 'The scramble card is removed from your feed and your teammates’ feeds. This can’t be undone.'
        : 'It’s removed from your feed, and your stats, handicap and anything this round earned (collectibles, badges) are recalculated without it. Friends’ rounds from the same group aren’t affected. This can’t be undone.'}
      onClose={onClose}
      actions={[{ label: 'Delete round', icon: 'trash', destructive: true, onPress: async () => { await data.deleteRound(round.id); onDone(); } }]}
    />
  );
}
