import { Component } from '@angular/core';
import { MatButton } from '@angular/material/button';

@Component({
  selector: 'cuteness-opfs',
  templateUrl: './opfs.component.html',
  styleUrl: './opfs.component.scss',
  imports: [MatButton],
})
export class OpfsComponent {
  protected async init() {
    const root = await navigator.storage.getDirectory().then((rootHandle) => {
      console.warn('root', rootHandle);

      return rootHandle;
    });

    const directory = await root
      .getDirectoryHandle('my', {
        create: true,
      })
      .then((directoryHandle) => {
        console.warn('directory', directoryHandle);

        return directoryHandle;
      });

    await directory.getFileHandle('pop', {
      create: true,
    });

    const file = await directory
      .getFileHandle('wow_2', {
        create: true,
      })
      .then((fileHandle) => {
        console.warn('file', fileHandle);

        return fileHandle;
      });

    const stream = await file.createWritable({ keepExistingData: true }).then((writableStream) => {
      console.warn('stream', writableStream);

      return writableStream;
    });

    await stream.write({
      data: 'hello world',
      position: await file.getFile().then((f) => f.size),
      type: 'write',
    });

    await stream.close();

    await file
      .getFile()
      .then((blob) => {
        console.warn('read', blob);

        return blob.text();
      })
      .then((text) => console.warn('text', text));

    for await (const [name, handle] of directory) {
      console.warn('aaaa', name, handle);
    }
  }
}

export default OpfsComponent;
