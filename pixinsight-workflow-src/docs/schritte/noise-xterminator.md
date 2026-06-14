<img src="../../assets/icons/NoiseXTerminator.svg" alt="NoiseXTerminator Icon" class="step-icon" />

# NoiseXTerminator

<div class="step-icon-clear"></div>

## Ziel

* NXT ist tolerant gegenueber vorherigen Bildbearbeitungsschritten.
* NXT kann auf lineare Daten, sowie auf bereits gestreckte Daten angewendet werden.
* Rauschreduzierung jeglicher Art darf nicht vor irgendwelchen Deconvolution, wie z.B. BXT, ausgefuehrt werden.
* Wie man die Parameter setzt wird im Video, sie  unten, vom Autor selbst erklaert.
	* Farbrauschen sollte staerker bis zu 100% entfernt werden.
	* Das menschliche Auge ist gegenueber Intensity Noise nicht so empfindlich.
	* Hoehere Anzahl von Iterationen schuetzt feine Details besser.
	* HF/LF Scale wird gesetzt indem 
		* Denoise HF auf 100% gesetzt wird
		* Denoise LF auf 100% gesetzt wird
		* HF/LF Scale auf den Punkt bewegt wird bis die interessanten feinen, nur schwach sichtbaren Details im Bild sichtbar werden.
		* Dann erfolgt die eigentliche Einstellung von LF Denoise.
	* Es ist sinnvoll ein uebermaessig gestreckte Vorschau zur Beurteilung zu verwenden.

## Referenzen / Additional Resources

* [Interview with Adam Block with Russel Croman about NXT](https://duckduckgo.com)