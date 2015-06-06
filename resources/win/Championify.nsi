############################################################################################
#      NSIS Installation Script created by NSIS Quick Setup Script Generator v1.09.18
#               Entirely Edited with NullSoft Scriptable Installation System
#              by Vlasis K. Barkas aka Red Wine red_wine@freemail.gr Sep 2006
############################################################################################

!define APP_NAME "Championify"
!define COMP_NAME "Dustin Blackman"
!define VERSION "{{ version }}.0"
!define COPYRIGHT "Dustin Blackman � 2015"
!define DESCRIPTION "{{ description }}"
!define INSTALLER_NAME "{{ outputFolder }}\Championify.WIN_Setup.{{ version.replace(/\./g, '-') }}.exe"
!define MAIN_APP_EXE "{{ exe }}.exe"
!define INSTALL_TYPE "SetShellVarContext current"
!define REG_ROOT "HKCU"
!define REG_APP_PATH "Software\Microsoft\Windows\CurrentVersion\App Paths\${MAIN_APP_EXE}"
!define UNINSTALL_PATH "Software\Microsoft\Windows\CurrentVersion\Uninstall\${APP_NAME}"

!define REG_START_MENU "Start Menu Folder"

var SM_Folder

######################################################################

VIProductVersion  "${VERSION}"
VIAddVersionKey "ProductName"  "${APP_NAME}"
VIAddVersionKey "CompanyName"  "${COMP_NAME}"
VIAddVersionKey "LegalCopyright"  "${COPYRIGHT}"
VIAddVersionKey "FileDescription"  "${DESCRIPTION}"
VIAddVersionKey "FileVersion"  "${VERSION}"

######################################################################

SetCompressor ZLIB
Name "${APP_NAME}"
Caption "${APP_NAME}"
OutFile "${INSTALLER_NAME}"
BrandingText "${APP_NAME}"
XPStyle on
InstallDirRegKey "${REG_ROOT}" "${REG_APP_PATH}" ""
InstallDir "$PROGRAMFILES\Championify"

######################################################################

!include "MUI.nsh"

!define MUI_ABORTWARNING
!define MUI_UNABORTWARNING

!insertmacro MUI_PAGE_WELCOME

!ifdef LICENSE_TXT
!insertmacro MUI_PAGE_LICENSE "${LICENSE_TXT}"
!endif

!insertmacro MUI_PAGE_DIRECTORY

!ifdef REG_START_MENU
!define MUI_STARTMENUPAGE_NODISABLE
!define MUI_STARTMENUPAGE_DEFAULTFOLDER "Championify"
!define MUI_STARTMENUPAGE_REGISTRY_ROOT "${REG_ROOT}"
!define MUI_STARTMENUPAGE_REGISTRY_KEY "${UNINSTALL_PATH}"
!define MUI_STARTMENUPAGE_REGISTRY_VALUENAME "${REG_START_MENU}"
!insertmacro MUI_PAGE_STARTMENU Application $SM_Folder
!endif

!insertmacro MUI_PAGE_INSTFILES

!insertmacro MUI_PAGE_FINISH

!insertmacro MUI_UNPAGE_CONFIRM

!insertmacro MUI_UNPAGE_INSTFILES

!insertmacro MUI_UNPAGE_FINISH

!insertmacro MUI_LANGUAGE "English"

######################################################################

Section -MainProgram
${INSTALL_TYPE}
SetOverwrite ifnewer
SetOutPath "$INSTDIR"
File "{{ dataPath }}\Championify.exe"
File "{{ dataPath }}\content_resources_200_percent.pak"
File "{{ dataPath }}\content_shell.pak"
File "{{ dataPath }}\d3dcompiler_47.dll"
File "{{ dataPath }}\ffmpegsumo.dll"
File "{{ dataPath }}\icudtl.dat"
File "{{ dataPath }}\libEGL.dll"
File "{{ dataPath }}\libGLESv2.dll"
File "{{ dataPath }}\LICENSE"
File "{{ dataPath }}\msvcp120.dll"
File "{{ dataPath }}\msvcr120.dll"
File "{{ dataPath }}\natives_blob.bin"
File "{{ dataPath }}\node.dll"
File "{{ dataPath }}\snapshot_blob.bin"
File "{{ dataPath }}\ui_resources_200_percent.pak"
File "{{ dataPath }}\vccorlib120.dll"
File "{{ dataPath }}\version"
File "{{ dataPath }}\xinput1_3.dll"
SetOutPath "$INSTDIR\resources"
File "{{ dataPath }}\resources\app.asar"
File "{{ dataPath }}\resources\atom.asar"
SetOutPath "$INSTDIR\locales"
File "{{ dataPath }}\locales\am.pak"
File "{{ dataPath }}\locales\ar.pak"
File "{{ dataPath }}\locales\bg.pak"
File "{{ dataPath }}\locales\bn.pak"
File "{{ dataPath }}\locales\ca.pak"
File "{{ dataPath }}\locales\cs.pak"
File "{{ dataPath }}\locales\da.pak"
File "{{ dataPath }}\locales\de.pak"
File "{{ dataPath }}\locales\el.pak"
File "{{ dataPath }}\locales\en-GB.pak"
File "{{ dataPath }}\locales\en-US.pak"
File "{{ dataPath }}\locales\es-419.pak"
File "{{ dataPath }}\locales\es.pak"
File "{{ dataPath }}\locales\et.pak"
File "{{ dataPath }}\locales\fa.pak"
File "{{ dataPath }}\locales\fi.pak"
File "{{ dataPath }}\locales\fil.pak"
File "{{ dataPath }}\locales\fr.pak"
File "{{ dataPath }}\locales\gu.pak"
File "{{ dataPath }}\locales\he.pak"
File "{{ dataPath }}\locales\hi.pak"
File "{{ dataPath }}\locales\hr.pak"
File "{{ dataPath }}\locales\hu.pak"
File "{{ dataPath }}\locales\id.pak"
File "{{ dataPath }}\locales\it.pak"
File "{{ dataPath }}\locales\ja.pak"
File "{{ dataPath }}\locales\kn.pak"
File "{{ dataPath }}\locales\ko.pak"
File "{{ dataPath }}\locales\lt.pak"
File "{{ dataPath }}\locales\lv.pak"
File "{{ dataPath }}\locales\ml.pak"
File "{{ dataPath }}\locales\mr.pak"
File "{{ dataPath }}\locales\ms.pak"
File "{{ dataPath }}\locales\nb.pak"
File "{{ dataPath }}\locales\nl.pak"
File "{{ dataPath }}\locales\pl.pak"
File "{{ dataPath }}\locales\pt-BR.pak"
File "{{ dataPath }}\locales\pt-PT.pak"
File "{{ dataPath }}\locales\ro.pak"
File "{{ dataPath }}\locales\ru.pak"
File "{{ dataPath }}\locales\sk.pak"
File "{{ dataPath }}\locales\sl.pak"
File "{{ dataPath }}\locales\sr.pak"
File "{{ dataPath }}\locales\sv.pak"
File "{{ dataPath }}\locales\sw.pak"
File "{{ dataPath }}\locales\ta.pak"
File "{{ dataPath }}\locales\te.pak"
File "{{ dataPath }}\locales\th.pak"
File "{{ dataPath }}\locales\tr.pak"
File "{{ dataPath }}\locales\uk.pak"
File "{{ dataPath }}\locales\vi.pak"
File "{{ dataPath }}\locales\zh-CN.pak"
File "{{ dataPath }}\locales\zh-TW.pak"
SectionEnd

######################################################################

Section -Icons_Reg
SetOutPath "$INSTDIR"
WriteUninstaller "$INSTDIR\uninstall.exe"

!ifdef REG_START_MENU
!insertmacro MUI_STARTMENU_WRITE_BEGIN Application
CreateDirectory "$SMPROGRAMS\$SM_Folder"
CreateShortCut "$SMPROGRAMS\$SM_Folder\${APP_NAME}.lnk" "$INSTDIR\${MAIN_APP_EXE}"
CreateShortCut "$DESKTOP\${APP_NAME}.lnk" "$INSTDIR\${MAIN_APP_EXE}"
CreateShortCut "$SMPROGRAMS\$SM_Folder\Uninstall ${APP_NAME}.lnk" "$INSTDIR\uninstall.exe"

!ifdef WEB_SITE
WriteIniStr "$INSTDIR\${APP_NAME} website.url" "InternetShortcut" "URL" "${WEB_SITE}"
CreateShortCut "$SMPROGRAMS\$SM_Folder\${APP_NAME} Website.lnk" "$INSTDIR\${APP_NAME} website.url"
!endif
!insertmacro MUI_STARTMENU_WRITE_END
!endif

!ifndef REG_START_MENU
CreateDirectory "$SMPROGRAMS\Championify"
CreateShortCut "$SMPROGRAMS\Championify\${APP_NAME}.lnk" "$INSTDIR\${MAIN_APP_EXE}"
CreateShortCut "$DESKTOP\${APP_NAME}.lnk" "$INSTDIR\${MAIN_APP_EXE}"
CreateShortCut "$SMPROGRAMS\Championify\Uninstall ${APP_NAME}.lnk" "$INSTDIR\uninstall.exe"

!ifdef WEB_SITE
WriteIniStr "$INSTDIR\${APP_NAME} website.url" "InternetShortcut" "URL" "${WEB_SITE}"
CreateShortCut "$SMPROGRAMS\Championify\${APP_NAME} Website.lnk" "$INSTDIR\${APP_NAME} website.url"
!endif
!endif

WriteRegStr ${REG_ROOT} "${REG_APP_PATH}" "" "$INSTDIR\${MAIN_APP_EXE}"
WriteRegStr ${REG_ROOT} "${UNINSTALL_PATH}"  "DisplayName" "${APP_NAME}"
WriteRegStr ${REG_ROOT} "${UNINSTALL_PATH}"  "UninstallString" "$INSTDIR\uninstall.exe"
WriteRegStr ${REG_ROOT} "${UNINSTALL_PATH}"  "DisplayIcon" "$INSTDIR\${MAIN_APP_EXE}"
WriteRegStr ${REG_ROOT} "${UNINSTALL_PATH}"  "DisplayVersion" "${VERSION}"
WriteRegStr ${REG_ROOT} "${UNINSTALL_PATH}"  "Publisher" "${COMP_NAME}"

!ifdef WEB_SITE
WriteRegStr ${REG_ROOT} "${UNINSTALL_PATH}"  "URLInfoAbout" "${WEB_SITE}"
!endif
SectionEnd

######################################################################

Section Uninstall
${INSTALL_TYPE}
Delete "$INSTDIR\Championify.exe"
Delete "$INSTDIR\content_resources_200_percent.pak"
Delete "$INSTDIR\content_shell.pak"
Delete "$INSTDIR\d3dcompiler_47.dll"
Delete "$INSTDIR\ffmpegsumo.dll"
Delete "$INSTDIR\icudtl.dat"
Delete "$INSTDIR\libEGL.dll"
Delete "$INSTDIR\libGLESv2.dll"
Delete "$INSTDIR\LICENSE"
Delete "$INSTDIR\msvcp120.dll"
Delete "$INSTDIR\msvcr120.dll"
Delete "$INSTDIR\natives_blob.bin"
Delete "$INSTDIR\node.dll"
Delete "$INSTDIR\snapshot_blob.bin"
Delete "$INSTDIR\ui_resources_200_percent.pak"
Delete "$INSTDIR\vccorlib120.dll"
Delete "$INSTDIR\version"
Delete "$INSTDIR\xinput1_3.dll"
Delete "$INSTDIR\resources\app.asar"
Delete "$INSTDIR\resources\atom.asar"
Delete "$INSTDIR\locales\am.pak"
Delete "$INSTDIR\locales\ar.pak"
Delete "$INSTDIR\locales\bg.pak"
Delete "$INSTDIR\locales\bn.pak"
Delete "$INSTDIR\locales\ca.pak"
Delete "$INSTDIR\locales\cs.pak"
Delete "$INSTDIR\locales\da.pak"
Delete "$INSTDIR\locales\de.pak"
Delete "$INSTDIR\locales\el.pak"
Delete "$INSTDIR\locales\en-GB.pak"
Delete "$INSTDIR\locales\en-US.pak"
Delete "$INSTDIR\locales\es-419.pak"
Delete "$INSTDIR\locales\es.pak"
Delete "$INSTDIR\locales\et.pak"
Delete "$INSTDIR\locales\fa.pak"
Delete "$INSTDIR\locales\fi.pak"
Delete "$INSTDIR\locales\fil.pak"
Delete "$INSTDIR\locales\fr.pak"
Delete "$INSTDIR\locales\gu.pak"
Delete "$INSTDIR\locales\he.pak"
Delete "$INSTDIR\locales\hi.pak"
Delete "$INSTDIR\locales\hr.pak"
Delete "$INSTDIR\locales\hu.pak"
Delete "$INSTDIR\locales\id.pak"
Delete "$INSTDIR\locales\it.pak"
Delete "$INSTDIR\locales\ja.pak"
Delete "$INSTDIR\locales\kn.pak"
Delete "$INSTDIR\locales\ko.pak"
Delete "$INSTDIR\locales\lt.pak"
Delete "$INSTDIR\locales\lv.pak"
Delete "$INSTDIR\locales\ml.pak"
Delete "$INSTDIR\locales\mr.pak"
Delete "$INSTDIR\locales\ms.pak"
Delete "$INSTDIR\locales\nb.pak"
Delete "$INSTDIR\locales\nl.pak"
Delete "$INSTDIR\locales\pl.pak"
Delete "$INSTDIR\locales\pt-BR.pak"
Delete "$INSTDIR\locales\pt-PT.pak"
Delete "$INSTDIR\locales\ro.pak"
Delete "$INSTDIR\locales\ru.pak"
Delete "$INSTDIR\locales\sk.pak"
Delete "$INSTDIR\locales\sl.pak"
Delete "$INSTDIR\locales\sr.pak"
Delete "$INSTDIR\locales\sv.pak"
Delete "$INSTDIR\locales\sw.pak"
Delete "$INSTDIR\locales\ta.pak"
Delete "$INSTDIR\locales\te.pak"
Delete "$INSTDIR\locales\th.pak"
Delete "$INSTDIR\locales\tr.pak"
Delete "$INSTDIR\locales\uk.pak"
Delete "$INSTDIR\locales\vi.pak"
Delete "$INSTDIR\locales\zh-CN.pak"
Delete "$INSTDIR\locales\zh-TW.pak"

RmDir "$INSTDIR\locales"
RmDir "$INSTDIR\resources"

Delete "$INSTDIR\uninstall.exe"
!ifdef WEB_SITE
Delete "$INSTDIR\${APP_NAME} website.url"
!endif

RmDir "$INSTDIR"

!ifdef REG_START_MENU
!insertmacro MUI_STARTMENU_GETFOLDER "Application" $SM_Folder
Delete "$SMPROGRAMS\$SM_Folder\${APP_NAME}.lnk"
Delete "$SMPROGRAMS\$SM_Folder\Uninstall ${APP_NAME}.lnk"
!ifdef WEB_SITE
Delete "$SMPROGRAMS\$SM_Folder\${APP_NAME} Website.lnk"
!endif
Delete "$DESKTOP\${APP_NAME}.lnk"

RmDir "$SMPROGRAMS\$SM_Folder"
!endif

!ifndef REG_START_MENU
Delete "$SMPROGRAMS\Championify\${APP_NAME}.lnk"
Delete "$SMPROGRAMS\Championify\Uninstall ${APP_NAME}.lnk"
!ifdef WEB_SITE
Delete "$SMPROGRAMS\Championify\${APP_NAME} Website.lnk"
!endif
Delete "$DESKTOP\${APP_NAME}.lnk"

RmDir "$SMPROGRAMS\Championify"
!endif

DeleteRegKey ${REG_ROOT} "${REG_APP_PATH}"
DeleteRegKey ${REG_ROOT} "${UNINSTALL_PATH}"
SectionEnd

######################################################################
