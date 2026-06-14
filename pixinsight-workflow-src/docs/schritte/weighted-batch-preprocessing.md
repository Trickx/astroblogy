<img src="../../assets/icons/WeightedBatchPreprocessing.svg" alt="Weighted Batch Preprocessing Icon" class="step-icon" />

# Weighted Batch Preprocessing

<div class="step-icon-clear"></div>

## Settings
Wenn der Dateistruktur, wie hier definiert [Folder Structure](folder-structure.md), gefolgt wurde, kann per Grouping Keyword zwischen den Sessions sauber getrennt werden. Insbesondere für Flats ist dies wichtig, da diese sonst in einen Topf geworfen würden.

#### Lights
<img src="../../assets/screenshots/WBPP_Lights.png" alt="WBPP Lights Settings" />

Lights Image Integration -> Rejection Alogrithm: Generalized Extreme Studentized Deviate soll laut [diesem Video](https://youtu.be/yLDmy32lm2E?t=156) bessere Ergebnisse liefern.
<img src="../../assets/screenshots/WBPP_Lights_IntegrationAlgo.png" alt="WBPP Lights Settings" />

#### Calibrate
<img src="../../assets/screenshots/WBPP_Calibration.png" alt="WBPP Settings" />

#### Post-Calibration
Beispiel mit sehr großer Exposure Tolerance um die Frames aus den beiden Sessions mit unterschiedlichen Belichtungszeiten zusammenzufassen:
<img src="../../assets/screenshots/WBPP_Post-Calibration1.png" alt="WBPP Post-Calibration Settings 1" />

Ebenso sollte man darauf achten, dass _Fast Integration_ nicht ausversehen **eingeschaltet** ist.

Beispiel mit kleinerer Exposure Tolerance um die Frames aus den beiden Sessions _nicht_ zusammenzufassen:
<img src="../../assets/screenshots/WBPP_Post-Calbibration2.png" alt="WBPP Post-Calibration Settings 2" />

#### Pipeline
In der Pipline zeigt sich ebenso ob am Ende alles in ein Masterframe gestackt wird, oder nicht:
<img src="../../assets/screenshots/WBPP_Pipeline1.png" alt="WBPP PoPipeline 1" />

<img src="../../assets/screenshots/WBPP_Pipeline2.png" alt="WBPP PoPipeline 2" />

