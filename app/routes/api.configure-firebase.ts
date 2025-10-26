import { json, type ActionFunctionArgs } from '@remix-run/node';
import { writeFile } from 'fs/promises';
import path from 'path';

export async function action({ request }: ActionFunctionArgs) {
  try {
    const formData = await request.formData();
    const config = formData.get('config');

    if (!config || typeof config !== 'string') {
      return json({ error: 'Invalid configuration' }, { status: 400 });
    }

    // Create config directory if it doesn't exist
    const configDir = path.join(process.cwd(), 'config');
    await require('fs').promises.mkdir(configDir, { recursive: true });

    // Write the config file
    const configPath = path.join(configDir, 'firebase.config.json');
    await writeFile(configPath, config);

    return json({ success: true });
  } catch (error) {
    console.error('Error saving Firebase config:', error);
    return json(
      { error: 'Failed to save configuration' },
      { status: 500 }
    );
  }
}
