import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButton } from '@angular/material/button';

@Component({
  selector: 'cuteness-opfs',
  imports: [CommonModule, MatButton],
  templateUrl: './opfs.component.html',
  styleUrl: './opfs.component.scss',
})
export class OpfsComponent {
  protected async init() {
    const root = await navigator.storage.getDirectory().then(root => {
      console.warn('root', root);

      return root;
    });

    const directory = await root.getDirectoryHandle('my', {
      create: true,
    }).then(directory => {
      console.warn('directory', directory);



      return directory
    });

    const file2 = await directory.getFileHandle('pop', {
      create: true,
    });

    const file = await directory.getFileHandle('wow_2', {
      create: true,
    }).then(file => {
      console.warn('file', file);

      return file;
    });


    const stream = await file.createWritable({ keepExistingData: true }).then(stream => {
      console.warn('stream', stream);

      return stream;
    });

    await stream.write({
      data: 'hello world',
      position: await file.getFile().then(f => f.size),
      type: 'write'
    });

    await stream.close();

    await file.getFile().then(file => {
      console.warn('read', file);

      return file.text();
    }).then(text => console.warn('text', text));

    // @ts-ignore
    for await (const [name, handle] of directory) {
      console.warn('aaaa', name, handle);
    }
  }
}


export default OpfsComponent;
