import os
import sys
import arcpy

arcpy.env.scratchWorkspace = os.path.join(os.path.dirname(__file__), "ProfileData")
arcpy.env.overwriteOutput = True

DEM = os.path.join(os.path.dirname(__file__), "ProfileData", "demdata.gdb", "dem90m")
ROUTE = os.path.join("in_memory", "input_route")
ROUTES = os.path.join("in_memory", "split_routes")
OUTPUT = os.path.join(arcpy.env.scratchGDB, "output_routes")
TEST = os.path.join(os.path.dirname(__file__), "ProfileData" , "dembnd.gdb", "profileschema")

def printMsg(msg):
    arcpy.AddMessage(msg)
    print(msg)

#Delete input and output routes
try:
    for fc in [ROUTES, OUTPUT, ROUTE]:
        if arcpy.Exists(fc):
            arcpy.Delete_management(fc)
            printMsg("Deleted " + fc)
except:
    printMsg("Delete in_memory workspace: " + arcpy.GetMessages(2))
    sys.exit(0)

#Get input parameter
inputFeatures = arcpy.GetParameter(0)

try:
    arcpy.CopyFeatures_management(inputFeatures, ROUTE)
    printMsg("Copied features into ROUTE feature class")
except:
    printMsg("Error copying features to ROUTE feature class: " + arcpy.GetMessages(2))

try:
    arcpy.SplitLine_management(ROUTE, ROUTES)
    printMsg("Split features into ROUTES feature class")
except:
    printMsg("Error splitting ROUTE feature class: " + arcpy.GetMessages(2))

if arcpy.CheckExtension("3D") == "Available":
    if arcpy.CheckOutExtension("3D") == "CheckedOut":
        printMsg("Checked out 3D license")
        try:
            #Create line of sight
            arcpy.LineOfSight_3d(DEM, ROUTES, OUTPUT)
            printMsg("Created line of sight OUTPUT")
            arcpy.SetParameter(1, arcpy.FeatureSet(OUTPUT))
        except:
            printMsg("Error creating line of sight OUTPUT: " + arcpy.GetMessages(2))
            #Return the new LOS feature
        finally:
            arcpy.CheckInExtension("3D")
            printMsg("Checked in 3D license")
    else:
        printMsg("Unable to check out 3D extention")
else:
    printMsg("3D extension is unavailable")
