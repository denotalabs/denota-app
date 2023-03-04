// SPDX-License-Identifier: BUSL-1.1
pragma solidity ^0.8.16;

/**
OpenSea metadata standards:
image
This is the URL to the image of the item. Can be just about any type of image (including SVGs, which will be cached into PNGs by OpenSea), and can be IPFS URLs or paths. We recommend using a 350 x 350 image.

image_data
Raw SVG image data, if you want to generate images on the fly (not recommended). Only use this if you're not including the image parameter.

external_url
This is the URL that will appear below the asset's image on OpenSea and will allow users to leave OpenSea and view the item on your site.

description
A human readable description of the item. Markdown is supported.

name
Name of the item.

attributes
These are the attributes for the item, which will show up on the OpenSea page for the item. (see below)

background_color
Background color of the item on OpenSea. Must be a six-character hexadecimal without a pre-pended #.

animation_url
A URL to a multi-media attachment for the item. The file extensions GLTF, GLB, WEBM, MP4, M4V, OGV, and OGG are supported, along with the audio-only extensions MP3, WAV, and OGA.
Animation_url also supports HTML pages, allowing you to build rich experiences and interactive NFTs using JavaScript canvas, WebGL, and more. Scripts and relative paths within the HTML page are now supported. However, access to browser extensions is not supported.

youtube_url
A URL to a YouTube video.
 */

library CheqBase64Encoding {
    function buildMetadata(
        uint256 _tokenId,
        address currency,
        uint256 escrowed,
        uint256 createdAt,
        address module,
        string memory _tokenURI
    ) external pure returns (string memory) {
        return
            string(
                abi.encodePacked(
                    "data:application/json;base64,",
                    encode(
                        bytes(
                            abi.encodePacked(
                                '{"name":',
                                "Cheq serial number #",
                                _tokenId,
                                // '", "description":"',
                                // cheq.description,
                                '", "external_url":"',
                                _tokenURI,
                                // '", "image": "',
                                // "data:image/svg+xml;base64,",
                                // buildImage(_tokenId),
                                ', "attributes": ',
                                "[",
                                '{"trait_type": "Token",',
                                '"value":',
                                currency,
                                "}",
                                // '{"trait_type": "Amount",',
                                // "}",
                                '{"trait_type": "Escrowed",',
                                '"value":',
                                escrowed,
                                "}",
                                '{"trait_type": "Drawer",',
                                "}",
                                '{"trait_type": "Created At",',
                                '"value":',
                                createdAt,
                                "}",
                                '{"trait_type": "Module",',
                                '"value":',
                                module,
                                "}",
                                "]",
                                "}"
                            )
                        )
                    )
                )
            );
    }

    /**
     * @dev Base64 Encoding/Decoding Table
     */
    string internal constant _TABLE =
        "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";

    /**
     * @dev Converts a `bytes` to its Bytes64 `string` representation.
     */
    function encode(bytes memory data) internal pure returns (string memory) {
        /**
         * Inspired by Brecht Devos (Brechtpd) implementation - MIT licence
         * https://github.com/Brechtpd/base64/blob/e78d9fd951e7b0977ddca77d92dc85183770daf4/base64.sol
         */
        if (data.length == 0) return "";

        // Loads the table into memory
        string memory table = _TABLE;

        // Encoding takes 3 bytes chunks of binary data from `bytes` data parameter
        // and split into 4 numbers of 6 bits.
        // The final Base64 length should be `bytes` data length multiplied by 4/3 rounded up
        // - `data.length + 2`  -> Round up
        // - `/ 3`              -> Number of 3-bytes chunks
        // - `4 *`              -> 4 characters for each chunk
        string memory result = new string(4 * ((data.length + 2) / 3));

        /// @solidity memory-safe-assembly
        assembly {
            // Prepare the lookup table (skip the first "length" byte)
            let tablePtr := add(table, 1)

            // Prepare result pointer, jump over length
            let resultPtr := add(result, 32)

            // Run over the input, 3 bytes at a time
            for {
                let dataPtr := data
                let endPtr := add(data, mload(data))
            } lt(dataPtr, endPtr) {

            } {
                // Advance 3 bytes
                dataPtr := add(dataPtr, 3)
                let input := mload(dataPtr)

                // To write each character, shift the 3 bytes (18 bits) chunk
                // 4 times in blocks of 6 bits for each character (18, 12, 6, 0)
                // and apply logical AND with 0x3F which is the number of
                // the previous character in the ASCII table prior to the Base64 Table
                // The result is then added to the table to get the character to write,
                // and finally write it in the result pointer but with a left shift
                // of 256 (1 byte) - 8 (1 ASCII char) = 248 bits

                mstore8(
                    resultPtr,
                    mload(add(tablePtr, and(shr(18, input), 0x3F)))
                )
                resultPtr := add(resultPtr, 1) // Advance

                mstore8(
                    resultPtr,
                    mload(add(tablePtr, and(shr(12, input), 0x3F)))
                )
                resultPtr := add(resultPtr, 1) // Advance

                mstore8(
                    resultPtr,
                    mload(add(tablePtr, and(shr(6, input), 0x3F)))
                )
                resultPtr := add(resultPtr, 1) // Advance

                mstore8(resultPtr, mload(add(tablePtr, and(input, 0x3F))))
                resultPtr := add(resultPtr, 1) // Advance
            }

            // When data `bytes` is not exactly 3 bytes long
            // it is padded with `=` characters at the end
            switch mod(mload(data), 3)
            case 1 {
                mstore8(sub(resultPtr, 1), 0x3d)
                mstore8(sub(resultPtr, 2), 0x3d)
            }
            case 2 {
                mstore8(sub(resultPtr, 1), 0x3d)
            }
        }

        return result;
    }
}
