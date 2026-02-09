import React, { useState, useEffect } from 'react';
import type { Message } from 'ai';
import { toast } from 'react-toastify';
import { MAX_FILES, isBinaryFile, shouldIncludeFile } from '~/utils/fileUtils';
import { createChatFromFolder } from '~/utils/folderImport';
import { logStore } from '~/lib/stores/logs'; // Assuming logStore is imported from this location
import { Button } from '~/components/ui/Button';
import { classNames } from '~/utils/classNames';
import { isMobile } from '~/utils/mobile';

interface ImportFolderButtonProps {
  className?: string;
  importChat?: (description: string, messages: Message[]) => Promise<void>;
}

export const ImportFolderButton: React.FC<ImportFolderButtonProps> = ({ className, importChat }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [isMobileView, setIsMobileView] = useState(false);

  useEffect(() => {
    setIsMobileView(isMobile());
  }, []);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const allFiles = Array.from(e.target.files || []);

    const filteredFiles = allFiles.filter((file) => {
      const path = file.webkitRelativePath.split('/').slice(1).join('/');
      const include = shouldIncludeFile(path);

      return include;
    });

    if (filteredFiles.length === 0) {
      const error = new Error('No valid files found');
      logStore.logError('File import failed - no valid files', error, { folderName: 'Unknown Folder' });
      toast.error('No files found in the selected folder');

      return;
    }

    if (filteredFiles.length > MAX_FILES) {
      const error = new Error(`Too many files: ${filteredFiles.length}`);
      logStore.logError('File import failed - too many files', error, {
        fileCount: filteredFiles.length,
        maxFiles: MAX_FILES,
      });
      toast.error(
        `This folder contains ${filteredFiles.length.toLocaleString()} files. This product is not yet optimized for very large projects. Please select a folder with fewer than ${MAX_FILES.toLocaleString()} files.`,
      );

      return;
    }

    const folderName = filteredFiles[0]?.webkitRelativePath.split('/')[0] || 'Unknown Folder';
    setIsLoading(true);

    const loadingToast = toast.loading(`Importing ${folderName}...`);

    try {
      const fileChecks = await Promise.all(
        filteredFiles.map(async (file) => ({
          file,
          isBinary: await isBinaryFile(file),
        })),
      );

      const textFiles = fileChecks.filter((f) => !f.isBinary).map((f) => f.file);
      const binaryFilePaths = fileChecks
        .filter((f) => f.isBinary)
        .map((f) => f.file.webkitRelativePath.split('/').slice(1).join('/'));

      if (textFiles.length === 0) {
        const error = new Error('No text files found');
        logStore.logError('File import failed - no text files', error, { folderName });
        toast.error('No text files found in the selected folder');

        return;
      }

      if (binaryFilePaths.length > 0) {
        logStore.logWarning(`Skipping binary files during import`, {
          folderName,
          binaryCount: binaryFilePaths.length,
        });
        toast.info(`Skipping ${binaryFilePaths.length} binary files`);
      }

      const messages = await createChatFromFolder(textFiles, binaryFilePaths, folderName);

      if (importChat) {
        await importChat(folderName, [...messages]);
      }

      logStore.logSystem('Folder imported successfully', {
        folderName,
        textFileCount: textFiles.length,
        binaryFileCount: binaryFilePaths.length,
      });
      toast.success('Folder imported successfully');
    } catch (error) {
      logStore.logError('Failed to import folder', error, { folderName });
      console.error('Failed to import folder:', error);
      toast.error('Failed to import folder');
    } finally {
      setIsLoading(false);
      toast.dismiss(loadingToast);
      e.target.value = ''; // Reset file input
    }
  };

  const handleMobileFolderImport = async () => {
    if (window.flutter_inappwebview) {
      setIsLoading(true);
      const loadingToast = toast.loading(`Opening native folder picker...`);
      try {
        const result = await window.flutter_inappwebview.callHandler('flutterApp', { type: 'folderPicker' });
        if (result && result.files) {
          const filesData = result.files as { name: string; path: string; content: string; isBinary: boolean }[];
          const folderName = result.folderName || 'Imported Folder';

          const processedFiles = filesData.map((fileData) => {
            // Create a File object from the base64 content
            const byteCharacters = atob(fileData.content);
            const byteNumbers = new Array(byteCharacters.length);
            for (let i = 0; i < byteCharacters.length; i++) {
              byteNumbers[i] = byteCharacters.charCodeAt(i);
            }
            const byteArray = new Uint8Array(byteNumbers);
            const file = new File([byteArray], fileData.name, { type: 'application/octet-stream' });
            // Attach webkitRelativePath for compatibility with createChatFromFolder
            Object.defineProperty(file, 'webkitRelativePath', {
              value: `${folderName}/${fileData.path}`,
              writable: false,
            });
            return file;
          });

          // Now process these files as if they came from a webkitdirectory input
          const allFiles = processedFiles;

          const filteredFiles = allFiles.filter((file) => {
            const path = file.webkitRelativePath.split('/').slice(1).join('/');
            const include = shouldIncludeFile(path);
            return include;
          });

          if (filteredFiles.length === 0) {
            toast.error('No valid files found in the selected folder');
            return;
          }

          if (filteredFiles.length > MAX_FILES) {
            toast.error(
              `This folder contains ${filteredFiles.length.toLocaleString()} files. This product is not yet optimized for very large projects. Please select a folder with fewer than ${MAX_FILES.toLocaleString()} files.`,
            );
            return;
          }

          toast.update(loadingToast, { render: `Importing ${folderName}...`, type: 'info', isLoading: true });

          const fileChecks = await Promise.all(
            filteredFiles.map(async (file) => ({
              file,
              isBinary: await isBinaryFile(file),
            })),
          );

          const textFiles = fileChecks.filter((f) => !f.isBinary).map((f) => f.file);
          const binaryFilePaths = fileChecks
            .filter((f) => f.isBinary)
            .map((f) => f.file.webkitRelativePath.split('/').slice(1).join('/'));

          if (textFiles.length === 0) {
            toast.error('No text files found in the selected folder');
            return;
          }

          if (binaryFilePaths.length > 0) {
            toast.info(`Skipping ${binaryFilePaths.length} binary files`);
          }

          const messages = await createChatFromFolder(textFiles, binaryFilePaths, folderName);

          if (importChat) {
            await importChat(folderName, [...messages]);
          }
          toast.success('Folder imported successfully');
        } else {
          toast.info('Folder selection cancelled or failed.');
        }
      } catch (error) {
        console.error('Failed to import folder via platform channel:', error);
        toast.error('Failed to import folder.');
      } finally {
        setIsLoading(false);
        toast.dismiss(loadingToast);
      }
    } else {
      toast.error('Mobile folder import not supported.');
    }
  };

  return (
    <>
      {!isMobileView ? (
        <input
          type="file"
          id="folder-import"
          className="hidden"
          webkitdirectory=""
          directory=""
          onChange={handleFileChange}
          {...({} as any)}
        />
      ) : null}
      <Button
        onClick={() => {
          if (isMobileView) {
            handleMobileFolderImport();
          } else {
            const input = document.getElementById('folder-import');
            input?.click();
          }
        }}
        title="Import Folder"
        variant="default"
        size="lg"
        className={classNames(
          'gap-2 bg-smack-elements-background-depth-1',
          'text-smack-elements-textPrimary',
          'hover:bg-smack-elements-background-depth-2',
          'border border-smack-elements-borderColor',
          'h-10 px-4 py-2 min-w-[120px] justify-center',
          'transition-all duration-200 ease-in-out',
          className,
        )}
        disabled={isLoading}
      >
        <span className="i-ph:upload-simple w-4 h-4" />
        {isLoading ? 'Importing...' : 'Import Folder'}
      </Button>
    </>
  );
};
