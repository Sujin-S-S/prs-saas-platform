import { Component, Input, Output, EventEmitter, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'ui-file-upload',
  standalone: true,
  imports: [CommonModule, MatButtonModule, MatIconModule],
  template: `
    <div 
      class="upload-dropzone"
      [class.drag-over]="isDragOver()"
      (dragover)="onDragOver($event)"
      (dragleave)="onDragLeave($event)"
      (drop)="onDrop($event)"
      (click)="fileInput.click()">
      
      <input 
        #fileInput 
        type="file" 
        [accept]="accept" 
        [multiple]="multiple" 
        style="display: none;" 
        (change)="onFileSelected($event)">
        
      <mat-icon class="upload-icon">cloud_upload</mat-icon>
      <p class="upload-text">Drag and drop file here, or click to browse</p>
      <p class="upload-hint">Supported files: {{ accept }} (Max: {{ maxSizeMb }}MB)</p>
    </div>

    <!-- Error Message -->
    <div *ngIf="errorMessage()" class="upload-error">
      {{ errorMessage() }}
    </div>

    <!-- Previews -->
    <div *ngIf="previews().length > 0" class="previews-container">
      <div *ngFor="let preview of previews(); let idx = index" class="preview-item">
        <img [src]="preview" alt="Preview">
        <button mat-icon-button class="remove-btn" (click)="removeFile(idx, $event)" title="Remove file">
          <mat-icon>cancel</mat-icon>
        </button>
      </div>
    </div>
  `,
  styles: [`
    .upload-dropzone {
      border: 2px dashed #ccc;
      border-radius: 8px;
      padding: 32px 16px;
      text-align: center;
      background: #f9f9f9;
      cursor: pointer;
      transition: all 0.3s ease;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 8px;
    }
    .upload-dropzone:hover, .upload-dropzone.drag-over {
      border-color: #1a73e8;
      background: #f1f6fe;
    }
    .upload-icon {
      font-size: 48px;
      width: 48px;
      height: 48px;
      color: #666;
    }
    .upload-dropzone:hover .upload-icon, .upload-dropzone.drag-over .upload-icon {
      color: #1a73e8;
    }
    .upload-text {
      margin: 0;
      font-size: 14px;
      font-weight: 500;
      color: #333;
      font-family: 'Inter', sans-serif;
    }
    .upload-hint {
      margin: 0;
      font-size: 12px;
      color: #666;
      font-family: 'Inter', sans-serif;
    }
    .upload-error {
      margin-top: 8px;
      color: #c5221f;
      font-size: 13px;
      font-family: 'Inter', sans-serif;
      font-weight: 500;
    }
    .previews-container {
      margin-top: 16px;
      display: flex;
      flex-wrap: wrap;
      gap: 12px;
    }
    .preview-item {
      position: relative;
      width: 100px;
      height: 100px;
      border: 1px solid #ddd;
      border-radius: 6px;
      overflow: hidden;
      box-shadow: 0 1px 3px rgba(0,0,0,0.1);
    }
    .preview-item img {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }
    .remove-btn {
      position: absolute !important;
      top: 0px;
      right: 0px;
      background: rgba(255, 255, 255, 0.8) !important;
      width: 28px !important;
      height: 28px !important;
      line-height: 28px !important;
      padding: 0 !important;
    }
    .remove-btn mat-icon {
      font-size: 18px;
      width: 18px;
      height: 18px;
      color: #c5221f;
      margin-top: -6px;
    }
  `]
})
export class FileUploadComponent {
  @Input() accept = 'image/*';
  @Input() maxSizeMb = 5;
  @Input() multiple = false;

  @Output() fileUploaded = new EventEmitter<string | string[]>();

  isDragOver = signal(false);
  previews = signal<string[]>([]);
  errorMessage = signal<string | null>(null);

  onDragOver(event: DragEvent): void {
    event.preventDefault();
    this.isDragOver.set(true);
  }

  onDragLeave(event: DragEvent): void {
    event.preventDefault();
    this.isDragOver.set(false);
  }

  onDrop(event: DragEvent): void {
    event.preventDefault();
    this.isDragOver.set(false);
    
    if (event.dataTransfer?.files) {
      this.processFiles(event.dataTransfer.files);
    }
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files) {
      this.processFiles(input.files);
    }
  }

  removeFile(index: number, event: MouseEvent): void {
    event.stopPropagation();
    const updated = [...this.previews()];
    updated.splice(index, 1);
    this.previews.set(updated);
    this.emitUploadedData();
  }

  private processFiles(files: FileList): void {
    this.errorMessage.set(null);
    const validFiles: File[] = [];

    const maxBytes = this.maxSizeMb * 1024 * 1024;

    for (let i = 0; i < files.length; i++) {
      const file = files[i];

      // Type validation check
      const mimeMatch = this.accept.replace('*', '');
      if (this.accept !== '*' && !file.type.match(mimeMatch)) {
        this.errorMessage.set(`Invalid file type: ${file.name}. Only ${this.accept} is supported.`);
        return;
      }

      // Size check
      if (file.size > maxBytes) {
        this.errorMessage.set(`File too large: ${file.name}. Max allowed size is ${this.maxSizeMb}MB.`);
        return;
      }

      validFiles.push(file);
      if (!this.multiple) break; // If single file upload, take only first
    }

    if (validFiles.length === 0) return;

    if (!this.multiple) {
      this.previews.set([]);
    }

    const loaders = validFiles.map((file) => this.fileToBase64(file));

    Promise.all(loaders).then((base64Strings) => {
      if (this.multiple) {
        this.previews.update((prev) => [...prev, ...base64Strings]);
      } else {
        this.previews.set(base64Strings);
      }
      this.emitUploadedData();
    });
  }

  private fileToBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = (err) => reject(err);
      reader.readAsDataURL(file);
    });
  }

  private emitUploadedData(): void {
    const data = this.previews();
    if (this.multiple) {
      this.fileUploaded.emit(data);
    } else {
      this.fileUploaded.emit(data[0] || '');
    }
  }
}
