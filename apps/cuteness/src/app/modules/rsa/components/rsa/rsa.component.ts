import { Component } from '@angular/core';
import { RSA, RSAKey } from '@cuteness/rsa';

@Component({
  selector: 'cuteness-rsa',
  templateUrl: './rsa.component.html',
  styleUrls: ['./rsa.component.scss'],
})
export class RSAComponent {
  private readonly RSA = new RSA();
  private privateRSAKey?: RSAKey;
  private publicRSAKey?: RSAKey;


  protected privateKey?: string;
  protected publicKey?: string;
  protected plainText?: string;
  protected encryptedText?: string;
  protected decryptedText?: string;


  public generateKeys() {
    const { publicKey, privateKey } = this.RSA.generateKeys();

    this.publicRSAKey = publicKey;
    this.privateRSAKey = privateKey;
    this.privateKey = privateKey.toPem();
    this.publicKey = privateKey.toPem();
  }

  public async encryptText() {
    if (this.publicKey && this.plainText) {
      const encryptedData = 'await this.RSA.encrypt(this.publicKey, this.plainText)';
      this.encryptedText = encryptedData.toString();
    }
  }

  public decryptText() {
    const decryptedData = 'crypto.privateDecrypt(this.privateKey, Buffer.from(this.encryptedText, \'base64\'))';
    this.decryptedText = decryptedData.toString();
  }
}
