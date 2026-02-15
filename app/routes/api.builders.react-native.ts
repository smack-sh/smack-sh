import { json, type ActionFunctionArgs } from '@remix-run/node';
import { ReactNativeAIConverterAdapter } from '~/lib/builders/react-native';
import { enqueueBuilderJob } from '~/lib/builders/jobs.server';

const converter = new ReactNativeAIConverterAdapter();

export async function action({ request }: ActionFunctionArgs) {
  try {
    const payload = (await request.json()) as {
      webCode?: string;
      bridgeFeature?: string;
      mode?: 'convert' | 'bridge' | 'build-eas';
      projectRoot?: string;
    };
    const mode = payload.mode || 'convert';

    if (mode === 'bridge') {
      if (!payload.bridgeFeature) {
        return json({ error: 'bridgeFeature is required for bridge mode' }, { status: 400 });
      }

      const bridge = await converter.generateNativeBridge(payload.bridgeFeature);

      return json(bridge);
    }

    if (mode === 'build-eas') {
      const job = await enqueueBuilderJob('react-native-eas-build', {
        projectRoot: payload.projectRoot || process.cwd(),
      });

      return json({ jobId: job.id, status: job.status, type: job.type });
    }

    if (!payload.webCode) {
      return json({ error: 'webCode is required for convert mode' }, { status: 400 });
    }

    const mobileCode = await converter.convertWebToMobile(payload.webCode);

    return json({ mobileCode });
  } catch (error) {
    console.error('React Native builder request failed:', error);
    return json({ error: error instanceof Error ? error.message : 'React Native generation failed' }, { status: 500 });
  }
}
