/*******************************************************************************
 * @license
 * Copyright (c) 2016 IBM Corporation and others.
 * All rights reserved. This program and the accompanying materials are made 
 * available under the terms of the Eclipse Public License v1.0 
 * (http://www.eclipse.org/legal/epl-v10.html), and the Eclipse Distribution 
 * License v1.0 (http://www.eclipse.org/org/documents/edl-v10.html). 
 * 
 * Contributors: IBM Corporation - initial API and implementation
 ******************************************************************************/
/*
 * Helper app to replace the electron icon inside of the Windows executable.
 * 
 * The replacement icon resource should have these image formats:
 *
 *    256x256x32 - PNG compression
 *    48x48x32 - BMP no compression
 *    32x32x32 - BMP no compression
 *    16x16x32 - BMP no compression
 */
/*eslint-env node */

if (process.argv.length < 4) {
	console.log("Usage: node iconexe.js <path to executable> <path to ICO replacement>");
	return;
}

var fs = require("fs");

function Struct(buf, props, off) {
	var desc = {};
	var offset = off || 0;
	var startOffset = offset;
	props.forEach(function(prop) {
		var getter, setter, s;
		if (prop.type) {
			var item = new Struct(buf, prop.type, offset);
			getter = function() {
				return new Struct(buf, prop.type, arguments[0]);
			};
			setter = function() {
				//NOT DONE
			};
			s = item.SIZE_OF;
		} else {
			if (prop.size === 8) {
				getter = Buffer.prototype.readUInt8;
				setter = Buffer.prototype.writeUInt8;
			} else if (prop.size === 16) {
				getter = prop.bigEndian ? Buffer.prototype.readUInt16BE : Buffer.prototype.readUInt16LE;
				setter = prop.bigEndian ? Buffer.prototype.writeUInt16BE : Buffer.prototype.writeUInt16LE;
			} else if (prop.size === 32) {
				getter = prop.bigEndian ? Buffer.prototype.readUInt32BE : Buffer.prototype.readUInt32LE;
				setter = prop.bigEndian ? Buffer.prototype.writeUInt32BE : Buffer.prototype.writeUInt32LE;
			} else if (prop.size === 64) {
				//BAD only 48
				getter = prop.bigEndian ? Buffer.prototype.readUIntBE : Buffer.prototype.readUIntLE;
				setter = prop.bigEndian ? Buffer.prototype.writeUIntBE : Buffer.prototype.writeUIntLE;
			}
			s = prop.size / 8 * (prop.arraySize || 1);
		}
		if (prop.arraySize) {
			var originalGetter = getter, originalSetter = setter;
			getter = function(o) {
				var result1 = [];
				for (var i = 0; i<prop.arraySize; i++) {
					var v = originalGetter.call(buf, o);
					result1.push(v);
					o += v.SIZE_OF;
				}
				return result1;
			};
			setter = function(value, o) {
				for (var i = 0; i<prop.arraySize; i++) {
					originalSetter.call(buf, value[i], o);
					o += value[i].size;
				}
			};
		}
		var oo = offset;
		desc[prop.name] = {
			configurable: true,
			enumerable: true,
			get: getter.bind(buf, offset),
			set: function (value) {
				return setter.call(buf, value, oo);
			}
		};
		offset += s;
		
	});
	var result = Object.create({}, desc);
	result.SIZE_OF = offset - startOffset;
	return result;
}

var IMAGE_DOS_HEADER = [
	{name: "e_magic", size: 16, unsigned: true},
	{name: "e_cblp", size: 16, unsigned: true},
	{name: "e_cp", size: 16, unsigned: true},
	{name: "e_crlc", size: 16, unsigned: true},
	{name: "e_cparhdr", size: 16, unsigned: true},
	{name: "e_minalloc", size: 16, unsigned: true},
	{name: "e_maxalloc", size: 16, unsigned: true},
	{name: "e_ss", size: 16, unsigned: true},
	{name: "e_sp", size: 16, unsigned: true},
	{name: "e_csum", size: 16, unsigned: true},
	{name: "e_ip", size: 16, unsigned: true},
	{name: "e_cs", size: 16, unsigned: true},
	{name: "e_lfarlc", size: 16, unsigned: true},
	{name: "e_ovno", size: 16, unsigned: true},
	{name: "e_res", size: 16, arraySize: 4, unsigned: true},
	{name: "e_oemid", size: 16, unsigned: true},
	{name: "e_oeminfo", size: 16, unsigned: true},
	{name: "e_res2", size: 16, arraySize: 10, unsigned: true},
	{name: "e_lfanew", size: 32, unsigned: true},
];

var IMAGE_FILE_HEADER = [
	{name: "Machine", size: 16, unsigned: true},
	{name: "NumberOfSections", size: 16, unsigned: true},
	{name: "TimeDateStamp", size: 32, unsigned: true},
	{name: "PointerToSymbolTable", size: 32, unsigned: true},
	{name: "NumberOfSymbols", size: 32, unsigned: true},
	{name: "SizeOfOptionalHeader", size: 16, unsigned: true},
	{name: "Characteristics", size: 16, unsigned: true},
];

var IMAGE_DATA_DIRECTORY = [
	{name: "VirtualAddress", size: 32, unsigned: true},
	{name: "Size", size: 32, unsigned: true},
];

var IMAGE_OPTIONAL_HEADER = [
	{name: "Magic", size: 16, unsigned: true},
	{name: "MajorLinkerVersion", size: 8, unsigned: true},
	{name: "MinorLinkerVersion", size: 8, unsigned: true},
	{name: "SizeOfCode", size: 32, unsigned: true},
	{name: "SizeOfInitializedData", size: 32, unsigned: true},
	{name: "SizeOfUninitializedData", size: 32, unsigned: true},
	{name: "AddressOfEntryPoint", size: 32, unsigned: true},
	{name: "BaseOfCode", size: 32, unsigned: true},
//	{name: "BaseOfData", size: 32, unsigned: true},
	{name: "ImageBase", size: 64, unsigned: true},
	{name: "SectionAlignment", size: 32, unsigned: true},
	{name: "FileAlignment", size: 32, unsigned: true},
	{name: "MajorOperatingSystemVersion", size: 16, unsigned: true},
	{name: "MinorOperatingSystemVersion", size: 16, unsigned: true},
	{name: "MajorImageVersion", size: 16, unsigned: true},
	{name: "MinorImageVersion", size: 16, unsigned: true},
	{name: "MajorSubsystemVersion", size: 16, unsigned: true},
	{name: "MinorSubsystemVersion", size: 16, unsigned: true},
	{name: "Win32VersionValue", size: 32, unsigned: true},
	{name: "SizeOfImage", size: 32, unsigned: true},
	{name: "SizeOfHeaders", size: 32, unsigned: true},
	{name: "CheckSum", size: 32, unsigned: true},
	{name: "Subsystem", size: 16, unsigned: true},
	{name: "DllCharacteristics", size: 16, unsigned: true},
	{name: "SizeOfStackReserve", size: 64, unsigned: true},
	{name: "SizeOfStackCommit", size: 64, unsigned: true},
	{name: "SizeOfHeapReserve", size: 64, unsigned: true},
	{name: "SizeOfHeapCommit", size: 64, unsigned: true},
	{name: "LoaderFlags", size: 32, unsigned: true},
	{name: "NumberOfRvaAndSizes", size: 32, unsigned: true},
	{name: "DataDirectory", type: IMAGE_DATA_DIRECTORY, arraySize: 16},
];

var IMAGE_NT_HEADERS = [
	{name: "Signature", size: 32, unsigned: false},
	{name: "FileHeader", type: IMAGE_FILE_HEADER},
	{name: "OptionalHeader", type: IMAGE_OPTIONAL_HEADER},
];

var IMAGE_SECTION_HEADER = [
	{name: "Name", size: 8, arraySize: 8, unsigned: false},
	{name: "Misc_VirtualSize", size: 32, unsigned: true},
	{name: "VirtualAddress", size: 32, unsigned: true},
	{name: "SizeOfRawData", size: 32, unsigned: true},
	{name: "PointerToRawData", size: 32, unsigned: true},
	{name: "PointerToRelocations", size: 32, unsigned: true},
	{name: "PointerToLinenumbers", size: 32, unsigned: true},
	{name: "NumberOfRelocations", size: 16, unsigned: true},
	{name: "NumberOfLinenumbers", size: 16, unsigned: true},
	{name: "Characteristics", size: 32, unsigned: true},
];

var IMAGE_RESOURCE_DIRECTORY = [
	{name: "Characteristics", size: 32, unsigned: true},
	{name: "TimeDateStamp", size: 32, unsigned: true},
	{name: "MajorVersion", size: 16, unsigned: true},
	{name: "MinorVersion", size: 16, unsigned: true},
	{name: "NumberOfNamedEntries", size: 16, unsigned: true},
	{name: "NumberOfIdEntries", size: 16, unsigned: true},
];

var IMAGE_RESOURCE_DIRECTORY_ENTRY = [
	{name: "Name", size: 32, unsigned: true},
	{name: "OffsetToData", size: 32, unsigned: true},
];

var IMAGE_RESOURCE_DATA_ENTRY = [
	{name: "OffsetToData", size: 32, unsigned: true},
	{name: "Size", size: 32, unsigned: true},
	{name: "CodePage", size: 32, unsigned: true},
	{name: "Reserved", size: 32, unsigned: true},
];

var BITMAPINFOHEADER = [
	{name: "biSize", size: 32, unsigned: true},
	{name: "biWidth", size: 32, unsigned: true},
	{name: "biHeight", size: 32, unsigned: true},
	{name: "biPlanes", size: 16, unsigned: true},
	{name: "biBitCount", size: 16, unsigned: true},
	{name: "biCompression", size: 32, unsigned: true},
	{name: "biSizeImage", size: 32, unsigned: true},
	{name: "biXPelsPerMeter", size: 32, unsigned: true},
	{name: "biYPelsPerMeter", size: 32, unsigned: true},
	{name: "biClrUsed", size: 32, unsigned: true},
	{name: "biClrImportant", size: 32, unsigned: true},
];

var ICONDIR = [
	{name: "idReserved", size: 16, unsigned: true},
	{name: "idType", size: 16, unsigned: true},
	{name: "idCount", size: 16, unsigned: true},
];

var ICONDIRENTRY = [
	{name: "bWidth", size: 8, unsigned: true},
	{name: "bHeight", size: 8, unsigned: true},
	{name: "bColorCount", size: 8, unsigned: true},
	{name: "bReserved", size: 8, unsigned: true},
	{name: "wPlanes", size: 16, unsigned: true},
	{name: "wBitCount", size: 16, unsigned: true},
	{name: "dwBytesInRes", size: 32, unsigned: true},
	{name: "dwImageOffset", size: 32, unsigned: true},
];

var PNGHEADER = [
	{name: "Signature1", size: 32, unsigned: true, bigEndian: true},
	{name: "Signature2", size: 32, unsigned: true, bigEndian: true},
	{name: "Length", size:32, unsigned: true, bigEndian: true},
	{name: "Type", size: 32, unsigned: true, bigEndian: true},
	{name: "Width", size: 32, unsigned: true, bigEndian: true},
	{name: "Height", size: 32, unsigned: true, bigEndian: true},
	{name: "BitDepth", size: 8, unsigned: true},
	{name: "ColorType", size: 8, unsigned: true},
];

var STRING_RC_HEADER = [
	{name: "wLength", size: 16, unsigned: true},
	{name: "wValueLength", size: 16, unsigned: true},
	{name: "wType", size:16, unsigned: true},
];

var VS_FIXEDFILEINFO = [
	{name: "dwSignature", size: 32, unsigned: true},
	{name: "dwStrucVersion", size: 32, unsigned: true},
	{name: "dwFileVersionMS", size: 32, unsigned: true},
	{name: "dwFileVersionLS", size: 32, unsigned: true},
	{name: "dwProductVersionMS", size: 32, unsigned: true},
	{name: "dwProductVersionLS", size: 32, unsigned: true},
	{name: "dwFileFlagsMask", size: 32, unsigned: true},
	{name: "dwFileFlags", size: 32, unsigned: true},
	{name: "dwFileOS", size: 32, unsigned: true},
	{name: "dwFileType", size: 32, unsigned: true},
	{name: "dwFileSubtype", size: 32, unsigned: true},
	{name: "dwFileDateMS", size: 32, unsigned: true},
	{name: "dwFileDateLS", size: 32, unsigned: true},
];

var IMAGE_DIRECTORY_ENTRY_RESOURCE = 2;
var DEBUG = false;
var RES_ICON = 1;
var RT_ICON = 3;
var RT_GROUP_ICON = 14;
var RT_VERSION = 16;
var BI_PNG = 65536;
var BUFFER_SIZE = 2048;

function readIcon(filename) {
	var fd = fs.openSync(filename, "r+");
	var buffer1 = new Buffer(BUFFER_SIZE);
	fs.readSync(fd, buffer1, 0, buffer1.length, 0);
	var header = new Struct(buffer1, ICONDIR);
	if (header.idReserved !== 0 || header.idType !== 1) {
		throw new Error("not a icon");
	}
	var icons = [];
	var o = header.SIZE_OF;
	for (var i = 0; i < header.idCount; i++) {
		var entry = new Struct(buffer1, ICONDIRENTRY, o);
		var buffer2 = new Buffer(entry.dwBytesInRes);
		fs.readSync(fd, buffer2, 0, entry.dwBytesInRes, entry.dwImageOffset);
		var icon = {
			entry: entry,
			infoHeader: new Struct(buffer2, BITMAPINFOHEADER),
			data: buffer2
		};
		console.log("read icon w=" + entry.bWidth + " h=" + entry.bHeight + " depth=" + entry.wBitCount + " compression=" + icon.infoHeader.biCompression);
		icons.push(icon);
		o += entry.SIZE_OF;
	}
	fs.closeSync(fd);
	return icons;
}

function readNullTerminated(buffer, o) {
	var str = "";
	do {
		var code = buffer.readUInt16LE(o);
		o += 2;
		if (code !== 0) {
			str += String.fromCharCode(code);
		}
	} while (code !== 0);
	return str;
}

function readResouceTable (buffer, off, getValue) {
	off = off || 0;
	var table = new Struct(buffer, STRING_RC_HEADER, off), o = off + table.SIZE_OF;
	table.szKey = readNullTerminated(buffer, o);
	o += (table.szKey.length + 1) * 2;
	function PadToDWORD(pos) {
		if (pos % 4 !== 0) return  4 - pos % 4;
		return 0;
	}
	o += PadToDWORD(o);
	if (table.wValueLength > 0) {
		table.Value = getValue(table, o);
		o += table.wValueLength * (typeof table.Value === "string" ? 2 : 1);
		o += PadToDWORD(o);
	}
	function Align(p) {
		return p + 3 & ~3;
	}
	o = Align(o);
	table.Children = {};
	while (o < off + table.wLength) {
		var child = readResouceTable(buffer, o, function(table1, o1) {
			return table1.wType === 1 ? readNullTerminated(buffer, o1) : buffer.readInt32LE(o1);
		});
		o += child.wLength;
		o = Align(o);
		table.Children[child.szKey] = child;
	}
	return table;
}

function readVersionInfo (buffer, off) {
	return readResouceTable(buffer, off, /* @callback */ function(table, o) {
		return new Struct(buffer, VS_FIXEDFILEINFO, o);
	});
}

function writeNullTerminated(buffer, str, o) {
	for (var i = 0; i < str.length; i++) {
		buffer.writeUInt16LE(str.charCodeAt(i), o);
		o += 2;
	}
	buffer.writeUInt16LE(0, o);
	o += 2;
	return o;
}

function writeResourceTable(table, buffer, off, setValue) {
	var startOffset = off;
	var newTable = new Struct(buffer, STRING_RC_HEADER, off);
	newTable.wLength = table.wLength;
	newTable.wValueLength = table.wValueLength;
	newTable.wType = table.wType;
	off += newTable.SIZE_OF;
	off = writeNullTerminated(buffer, table.szKey, off);
	function PadToDWORD(pos) {
		if (pos % 4 !== 0) {
			var count = 4 - pos % 4;
			for (var j=0; j<count; j++) buffer.writeInt8(0);
			return count;
		}
		return 0;
	}
	off += PadToDWORD(off);
	var valueOff = off;
	if (table.Value) {
		off = setValue(newTable, table.Value, off);
		off += PadToDWORD(off);
	}
	newTable.wValueLength = off - valueOff;
	if (table.Children) {
		Object.keys(table.Children).sort().forEach(function(key) {
			off = writeResourceTable(table.Children[key], buffer, off, /* @callback */ function(table1, value, o1) {
				if (typeof value === "string") {
					return writeNullTerminated(buffer, value, o1);
				}
				if (typeof value === "number") {
					buffer.writeInt32LE(value, o1);
					return o1 + 4;
				}
				return o1;
			});
		});
	}
	newTable.wLength = off -startOffset;
	return off;
}

function writeVersionInfo (table, buffer, off) {
	return writeResourceTable(table, buffer, off, /* @callback */ function(table, value, o) {
		var fixedInfo = new Struct(buffer, VS_FIXEDFILEINFO, o);
		for (var p in value) {
			fixedInfo[p] = value[p];
		}
		return o + fixedInfo.SIZE_OF;
	});
}

// Read replacement icons
var icons = [];
for (var j=3; j<process.argv.length; j++) {
	icons = icons.concat(readIcon(process.argv[j]));
}

var exe = process.argv[2];
var fd = fs.openSync(exe, "r+");
var buffer1 = new Buffer(BUFFER_SIZE);
fs.readSync(fd, buffer1, 0, buffer1.length, 0);
var imageDosHeader = new Struct(buffer1, IMAGE_DOS_HEADER);

if (imageDosHeader.e_magic !== 0x5a4d) {
	throw new Error('Bad exe e_magic=' +Number(imageDosHeader.e_magic).toString(16));
}

var buffer2 = new Buffer(BUFFER_SIZE);
fs.readSync(fd, buffer2, 0, buffer2.length, imageDosHeader.e_lfanew);
var imageNtHeaders = new Struct(buffer2, IMAGE_NT_HEADERS);

if (imageNtHeaders.Signature !== 0x00004550) {
	throw new Error('Bad exe signature=' +Number(imageNtHeaders.Signature).toString(16));
}

var resourcesRVA = imageNtHeaders.OptionalHeader.DataDirectory[IMAGE_DIRECTORY_ENTRY_RESOURCE].VirtualAddress;
if (resourcesRVA === 0)
	throw new Error('no icons in exe');

var buffer3 = new Buffer(BUFFER_SIZE);
fs.readSync(fd, buffer3, 0, buffer3.length, imageDosHeader.e_lfanew + 4/*Signature*/ + imageNtHeaders.FileHeader.SIZE_OF + imageNtHeaders.FileHeader.SizeOfOptionalHeader);
var found = false;
var aa = 0;
for (var i = 0; i < imageNtHeaders.FileHeader.NumberOfSections; i++) {
	var imageSectionHeader = new Struct(buffer3, IMAGE_SECTION_HEADER, aa);
	if (resourcesRVA >= imageSectionHeader.VirtualAddress && resourcesRVA < imageSectionHeader.VirtualAddress + imageSectionHeader.Misc_VirtualSize) {
		// could check the imageSectionHeader name is .rsrc
		found = true;
		break;
	}
	aa += imageSectionHeader.SIZE_OF;
}
if (!found)
	return new Error('no icons in exe');
	
var delta = imageSectionHeader.VirtualAddress - imageSectionHeader.PointerToRawData;
var imageResourceDirectoryOffset = resourcesRVA - delta;
walkResourceDirectory(imageResourceDirectoryOffset, imageResourceDirectoryOffset, delta, 0, 0, false);

function walkResourceDirectory(imageResourceDirectoryOffset, resourceBase, delta, type, level, parentType) {
	if (DEBUG)
		console.log("** LEVEL " + level); //$NON-NLS-1$

	var buffer = new Buffer(BUFFER_SIZE);
	fs.readSync(fd, buffer, 0, buffer.length, imageResourceDirectoryOffset);
	var imageResourceDirectory = new Struct(buffer, IMAGE_RESOURCE_DIRECTORY);

	if (DEBUG) {
		var sType = "" + type; //$NON-NLS-1$
		// level 1 resources are resource types
		if (level === 1) {
			console.log("___________________________"); //$NON-NLS-1$
			if (type === RT_ICON)
				sType = "RT_ICON"; //$NON-NLS-1$
			if (type === RT_GROUP_ICON)
				sType = "RT_GROUP_ICON"; //$NON-NLS-1$
			if (type === RT_VERSION)
				sType = "RT_VERSION"; //$NON-NLS-1$
		}
		console.log("Resource Directory [" + sType + "]" + " (Named " + imageResourceDirectory.NumberOfNamedEntries + ", ID " + imageResourceDirectory.NumberOfIdEntries + ")"); //$NON-NLS-1$ //$NON-NLS-2$ //$NON-NLS-3$ //$NON-NLS-4$ //$NON-NLS-5$
	}

	var imageResourceDirectoryEntries = [];
	var bb = imageResourceDirectory.SIZE_OF;
	for (var i = 0; i < imageResourceDirectory.NumberOfIdEntries; i++) {
		var st = new Struct(buffer, IMAGE_RESOURCE_DIRECTORY_ENTRY, bb);
		imageResourceDirectoryEntries.push(st);
		bb += st.SIZE_OF;
	}
	for (i = 0; i < imageResourceDirectoryEntries.length; i++) {
		var irde = imageResourceDirectoryEntries[i];
		if ((irde.OffsetToData & 1 << 31) !== 0 ) {
			walkResourceDirectory((irde.OffsetToData & 0x7FFFFFFF) + resourceBase, resourceBase, delta, (irde.Name & 0xFFFF) >> 0, level + 1, type);
		} else {
			var buffer1 = new Buffer(BUFFER_SIZE);
			fs.readSync(fd, buffer1, 0, buffer1.length, irde.OffsetToData + resourceBase);
			var data = new Struct(buffer1, IMAGE_RESOURCE_DATA_ENTRY);
			if (DEBUG)
				console.log("Resource Id " + (irde.Name & 0xFFFF) + " Data Offset RVA " + data.OffsetToData + ", Size " + data.Size); //$NON-NLS-1$ //$NON-NLS-2$ //$NON-NLS-3$
			if (parentType === RT_ICON) {
				var buffer2 = new Buffer(data.Size);
				fs.readSync(fd, buffer2, 0, data.Size, data.OffsetToData - delta);
				var png = new Struct(buffer2, PNGHEADER);
				if (png.Signature1 === 0x89504E47 && png.Signature2 === 0xD0A1A0A) {//PNG
					if (!icons.some(function(replaceIcon) {
						if (replaceIcon.infoHeader.biCompression === BI_PNG) {
							var replacePng = new Struct(replaceIcon.data, PNGHEADER);
							if (png.Width === replacePng.Width && png.Height === replacePng.Height && 
								png.BitDepth === replacePng.BitDepth && png.ColorType === replacePng.ColorType &&
								data.Size >= replaceIcon.data.length)
							{
								console.log("png replaced w=" + png.Width + " h=" + png.Height + " depth=" + png.BitDepth + " colorType=" + png.ColorType);
								fs.writeSync(fd, replaceIcon.data, 0, replaceIcon.data.length, data.OffsetToData - delta);
							}
							return true;
						}
					})) {
						throw new Error("Could find replacement png w=" + png.Width + " h=" + png.Height + " depth=" + png.BitDepth + " colorType=" + png.ColorType);
					}
				} else {
					var icon = new Struct(buffer2, BITMAPINFOHEADER);
					if (!icons.some(function(replaceIcon) {
						if (replaceIcon.infoHeader.biWidth === icon.biWidth && replaceIcon.infoHeader.biHeight === icon.biHeight && replaceIcon.infoHeader.biBitCount === icon.biBitCount) {
							if (data.Size >= replaceIcon.data.length) {
								console.log("icon replaced w=" + icon.biWidth + " h=" + icon.biHeight + " depth=" + icon.biBitCount);
								fs.writeSync(fd, replaceIcon.data, 0, replaceIcon.data.length, data.OffsetToData - delta);
							}
							return true;
						}
					})) {
						throw new Error("Could find replacement ico w=" + icon.biWidth + " h=" + icon.biHeight + " depth=" + icon.biBitCount);
					}
				}
			} else if (parentType === RT_VERSION) {
				var buffer3 = new Buffer(data.Size);
				fs.readSync(fd, buffer3, 0, data.Size, data.OffsetToData - delta);
				var versionInfo = readVersionInfo(buffer3, 0);
				var info = versionInfo.Children["StringFileInfo"].Children["040904b0"].Children;
				info["CompanyName"].Value = "Eclipse";
				info["ProductName"].Value = "Orion";
				info["FileDescription"].Value = "Orion";
				info["LegalCopyright"].Value = "Copyright (c) 2016 IBM Corporation.";
				info["FileVersion"].Value = "0.0.101.v201605111200";
				info["ProductVersion"].Value = "0.0.101.v201605111200";
				info["OriginalFilename"].Value = "Orion.exe";
				info["InternalName"].Value = "Orion.exe";
				var buffer4 = new Buffer(data.Size);
				var size = writeVersionInfo(versionInfo, buffer4, 0);
				if (size < buffer4.length) {
					fs.writeSync(fd, buffer4, 0, size, data.OffsetToData - delta);
				} else {
					throw new Error("Could not update version info. Size of new version is larger then original");
				}
			}
		}
	}
}
fs.closeSync(fd);
console.log("done");
