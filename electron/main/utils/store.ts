import ElectronStore from 'electron-store';
import * as keytar from 'keytar';
import { randomBytes } from 'crypto';

const SERVICE_NAME = 'smack-electron-store-encryption-key';
const ACCOUNT_NAME = 'default';

async function getEncryptionKey() {
  let key = await keytar.getPassword(SERVICE_NAME, ACCOUNT_NAME);
  if (!key) {
    key = randomBytes(32).toString('hex');
    await keytar.setPassword(SERVICE_NAME, ACCOUNT_NAME, key);
  }
  return key;
}

export const store = new ElectronStore<any>({
  encryptionKey: await getEncryptionKey(),
});
