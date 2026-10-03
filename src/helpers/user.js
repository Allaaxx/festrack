/**
 * Normalizes user data ensuring both camelCase and snake_case properties
 * are present along with id, name, and email.
 *
 * @param {object|null|undefined} user
 * @returns {object|null}
 */
export const normalizeUser = (user) => {
  if (!user) return null;

  const firstName =
    user.firstName ||
    user.first_name ||
    (user.name ? user.name.split(' ')[0] : '');

  const lastName =
    user.lastName ||
    user.last_name ||
    (user.name ? user.name.split(' ').slice(1).join(' ') : '');

  const name = user.name || `${firstName} ${lastName}`.trim();

  return {
    ...user,
    id: user.id,
    name,
    firstName,
    lastName,
    first_name: firstName,
    last_name: lastName,
    email: user.email,
  };
};
