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
      className={classNames('flex items-center px-4 lg:px-6 border-b h-[var(--header-height)] transition-colors duration-300', {
        'border-transparent': !chat.started,
        'border-smack-elements-borderColor bg-smack-elements-background/80 backdrop-blur-md': chat.started,
      })}
    >
      <div className="flex items-center gap-3 z-logo text-smack-elements-textPrimary cursor-pointer">
        <button className="i-ph:sidebar-simple-duotone text-xl p-2 rounded-lg hover:bg-smack-elements-background-depth-2 transition-colors" />
        <a href="/chat" className="text-2xl font-semibold text-accent flex items-center">
          {/* <span className="i-smack:logo-text?mask w-[46px] inline-block" /> */}
          <img src="/logo-light-styled.png" alt="logo" className="w-[80px] inline-block dark:hidden" />
          <img src="/logo-dark-styled.png" alt="logo" className="w-[80px] inline-block hidden dark:block" />
        </a>
      </div>
      {chat.started && ( // Display ChatDescription and HeaderActionButtons only when the chat has started.
        <>
          <span className="flex-1 px-4 lg:px-8 truncate text-center text-smack-elements-textPrimary">
            <ClientOnly>{() => <ChatDescription />}</ClientOnly>
          </span>
          <ClientOnly>
            {() => (
              <div className="flex items-center gap-3">
                <HeaderActionButtons chatStarted={chat.started} />
                <UserButton afterSignOutUrl="/" appearance={{
                  elements: {
                    avatarBox: "w-9 h-9"
                  }
                }} />
              </div>
            )}
          </ClientOnly>
        </>
      )}
      {!chat.started && (
        <div className="ml-auto">
          <ClientOnly>
            {() => <UserButton afterSignOutUrl="/" appearance={{
              elements: {
                avatarBox: "w-9 h-9"
              }
            }} />}
          </ClientOnly>
        </div>
      )}
    </header>
  );
}
