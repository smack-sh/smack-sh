import { useStore } from '@nanostores/react';
import { ClientOnly } from 'remix-utils/client-only';
import { chatStore } from '~/lib/stores/chat';
import { classNames } from '~/utils/classNames';
import { HeaderActionButtons } from './HeaderActionButtons.client';
import { ChatDescription } from '~/lib/persistence/ChatDescription.client';
import { UserButton } from '@clerk/remix';

export function Header() {
  const chat = useStore(chatStore);

  return (
    <header
      className={classNames('flex items-center px-4 border-b h-[var(--header-height)]', {
        'border-transparent': !chat.started,
        'border-smack-elements-borderColor': chat.started,
      })}
    >
      <div className="flex items-center gap-2 z-logo text-smack-elements-textPrimary cursor-pointer">
        <div className="i-ph:sidebar-simple-duotone text-xl" />
        <a href="/chat" className="text-2xl font-semibold text-accent flex items-center">
          {/* <span className="i-smack:logo-text?mask w-[46px] inline-block" /> */}
          <img src="/logo-light-styled.png" alt="logo" className="w-[90px] inline-block dark:hidden" />
          <img src="/logo-dark-styled.png" alt="logo" className="w-[90px] inline-block hidden dark:block" />
        </a>
      </div>
      {chat.started && ( // Display ChatDescription and HeaderActionButtons only when the chat has started.
        <>
          <span className="flex-1 px-4 truncate text-center text-smack-elements-textPrimary">
            <ClientOnly>{() => <ChatDescription />}</ClientOnly>
          </span>
          <ClientOnly>
            {() => (
              <div className="flex items-center gap-3">
                <HeaderActionButtons chatStarted={chat.started} />
                <UserButton afterSignOutUrl="/" />
              </div>
            )}
          </ClientOnly>
        </>
      )}
      {!chat.started && (
        <div className="ml-auto">
          <ClientOnly>
            {() => <UserButton afterSignOutUrl="/" />}
          </ClientOnly>
        </div>
      )}
    </header>
  );
}
