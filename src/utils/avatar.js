import { createAvatar } from '@dicebear/core';
import { bottts } from '@dicebear/collection';

export const generateAvatar = (nickname) => {
  const avatar = createAvatar(bottts, {
    seed: nickname,
    size: 40,
    backgroundColor: ['b6e3f4', 'c0aede', 'ffdfbf'],
    radius: 50,
  });

  return avatar.toDataUriSync();
};

export const generateAvatarUrl = (nickname, size = 40) => {
  const avatar = createAvatar(bottts, {
    seed: nickname,
    size: size,
    backgroundColor: ['b6e3f4', 'c0aede', 'ffdfbf'],
    radius: 50,
  });

  return avatar.toDataUriSync();
}; 