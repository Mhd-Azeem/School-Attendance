package com.azeem.schoolattendance

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp

private enum class DemoStatus { PRESENT, ABSENT, LATE }
private data class DemoStudent(val admission:String,val name:String)
private val demoStudents=listOf(
 DemoStudent("1001","Aahil Ahmed"),DemoStudent("1002","Aisha Nazeer"),DemoStudent("1003","Akram Fawaz"),
 DemoStudent("1004","Amaya Perera"),DemoStudent("1005","Danish Rizwan"),DemoStudent("1006","Fathima Hana"),
 DemoStudent("1007","Ibrahim Rilwan"),DemoStudent("1008","Kavindu Silva"),DemoStudent("1009","Maryam Safa"),
 DemoStudent("1010","Mohamed Ihsan"),DemoStudent("1011","Nethmi Jayasinghe"),DemoStudent("1012","Zainab Farha")
)

@Composable fun DemoApp(){var screen by remember{mutableStateOf("dashboard")};when(screen){"attendance"->DemoAttendance(onBack={screen="dashboard"});else->DemoDashboard(onOpenAttendance={screen="attendance"})}}

@OptIn(ExperimentalMaterial3Api::class)
@Composable private fun DemoTopBar(title:String,onBack:(()->Unit)?=null){TopAppBar(navigationIcon={if(onBack!=null)TextButton(onClick=onBack){Text("‹ Back")}},title={Column{Text(title,fontWeight=FontWeight.Bold);Text("OFFLINE DEMO · NO SIGN-IN",style=MaterialTheme.typography.labelSmall,color=Color(0xFFB76A00))}},colors=TopAppBarDefaults.topAppBarColors(containerColor=Color.White))}

@OptIn(ExperimentalMaterial3Api::class)
@Composable private fun DemoDashboard(onOpenAttendance:()->Unit){
 val classes=(10..11).flatMap{g->('A'..'E').map{"$g-$it"}}
 Scaffold(topBar={DemoTopBar("School Attendance Demo")}){pad->LazyColumn(Modifier.fillMaxSize().padding(pad).background(Color(0xFFF4F7F9)).padding(16.dp),verticalArrangement=Arrangement.spacedBy(14.dp)){
  item{Column{Text("Section Head Dashboard",style=MaterialTheme.typography.headlineSmall,fontWeight=FontWeight.Bold);Text("Thursday, 24 September 2026",color=Color.Gray)}}
  item{Row(Modifier.fillMaxWidth(),horizontalArrangement=Arrangement.spacedBy(8.dp)){DemoStat("Present","326",Color(0xFF16845B),Modifier.weight(1f));DemoStat("Absent","18",Color(0xFFC44848),Modifier.weight(1f));DemoStat("Late","7",Color(0xFFC37912),Modifier.weight(1f))}}
  item{Row(Modifier.fillMaxWidth(),horizontalArrangement=Arrangement.spacedBy(8.dp)){DemoStat("Attendance","94.9%",Color(0xFF256F9E),Modifier.weight(1f));DemoStat("Submitted","8/10",Color(0xFF173B57),Modifier.weight(1f))}}
  item{Card(colors=CardDefaults.cardColors(containerColor=Color(0xFFFFF3DE))){Column(Modifier.padding(16.dp)){Text("Pending Classes",fontWeight=FontWeight.Bold,color=Color(0xFF8A5707));Text("10-C  ·  11-B",color=Color(0xFF8A5707))}}}
  items(classes){name->val pending=name in listOf("10-C","11-B");Card(onClick={if(name=="10-A")onOpenAttendance()},colors=CardDefaults.cardColors(containerColor=Color.White)){Row(Modifier.fillMaxWidth().padding(16.dp),verticalAlignment=Alignment.CenterVertically,horizontalArrangement=Arrangement.SpaceBetween){Box(Modifier.background(Color(0xFFE5F0F6),RoundedCornerShape(8.dp)).padding(horizontal=12.dp,vertical=8.dp)){Text(name,fontWeight=FontWeight.Bold,color=Color(0xFF173B57))};Column(horizontalAlignment=Alignment.End){Text(if(pending)"◷ Not submitted" else "✓ Submitted",color=if(pending)Color.Gray else Color(0xFF16845B),fontWeight=FontWeight.SemiBold);Text(if(name=="10-A")"Tap to open teacher demo" else if(pending)"Waiting for teacher" else "Attendance recorded",style=MaterialTheme.typography.bodySmall,color=Color.Gray)}}}}
  item{Spacer(Modifier.height(12.dp));Button(onClick=onOpenAttendance,modifier=Modifier.fillMaxWidth().height(52.dp)){Text("Open Teacher Demo — 10-A")};Text("All names and numbers in this demo are fictional.",style=MaterialTheme.typography.bodySmall,color=Color.Gray,modifier=Modifier.padding(top=6.dp))}
 }}
}

@Composable private fun DemoStat(label:String,value:String,color:Color,modifier:Modifier=Modifier){Card(modifier,colors=CardDefaults.cardColors(containerColor=Color.White)){Column(Modifier.padding(14.dp)){Text(label,style=MaterialTheme.typography.labelMedium,color=Color.Gray);Text(value,style=MaterialTheme.typography.titleLarge,fontWeight=FontWeight.Bold,color=color)}}}

@OptIn(ExperimentalMaterial3Api::class)
@Composable private fun DemoAttendance(onBack:()->Unit){
 var submitted by remember{mutableStateOf(false)};var confirm by remember{mutableStateOf(false)}
 var statuses by remember{mutableStateOf(demoStudents.associate{it.admission to DemoStatus.PRESENT})}
 val present=statuses.values.count{it==DemoStatus.PRESENT};val absent=statuses.values.count{it==DemoStatus.ABSENT};val late=statuses.values.count{it==DemoStatus.LATE}
 if(confirm)AlertDialog(onDismissRequest={confirm=false},title={Text("Submit attendance for 10-A?")},text={Text("Present: $present\nAbsent: $absent\nLate: $late\n\n24 September 2026")},dismissButton={TextButton(onClick={confirm=false}){Text("Cancel")}},confirmButton={Button(onClick={confirm=false;submitted=true}){Text("Confirm Submission")}})
 Scaffold(topBar={DemoTopBar("Class 10-A",onBack)}){pad->Column(Modifier.fillMaxSize().padding(pad).background(Color(0xFFF4F7F9))){
  if(submitted)Box(Modifier.fillMaxSize().padding(24.dp),contentAlignment=Alignment.Center){Card(colors=CardDefaults.cardColors(containerColor=Color.White)){Column(Modifier.padding(32.dp),horizontalAlignment=Alignment.CenterHorizontally,verticalArrangement=Arrangement.spacedBy(12.dp)){Text("✓",style=MaterialTheme.typography.displayMedium,color=Color(0xFF16845B));Text("Attendance Submitted",style=MaterialTheme.typography.headlineSmall,fontWeight=FontWeight.Bold);Text("Demo submission completed locally.\nNo information was sent to a server.",color=Color.Gray);Button(onClick={submitted=false}){Text("Try Again")}}}}
  else LazyColumn(Modifier.fillMaxSize().padding(16.dp),verticalArrangement=Arrangement.spacedBy(10.dp)){
   item{Row(Modifier.fillMaxWidth(),horizontalArrangement=Arrangement.spacedBy(7.dp)){DemoCount("Present",present,Color(0xFF16845B),Modifier.weight(1f));DemoCount("Absent",absent,Color(0xFFC44848),Modifier.weight(1f));DemoCount("Late",late,Color(0xFFC37912),Modifier.weight(1f));DemoCount("Total",demoStudents.size,Color(0xFF173B57),Modifier.weight(1f))}}
   item{OutlinedButton(onClick={statuses=demoStudents.associate{it.admission to DemoStatus.PRESENT}},modifier=Modifier.fillMaxWidth()){Text("MARK ALL PRESENT")}}
   items(demoStudents){student->Card(colors=CardDefaults.cardColors(containerColor=Color.White)){Column(Modifier.padding(14.dp),verticalArrangement=Arrangement.spacedBy(10.dp)){Row(Modifier.fillMaxWidth(),horizontalArrangement=Arrangement.SpaceBetween){Text(student.name,fontWeight=FontWeight.SemiBold);Text(student.admission,color=Color.Gray)};Row(Modifier.fillMaxWidth(),horizontalArrangement=Arrangement.spacedBy(6.dp)){DemoStatus.entries.forEach{s->val selected=statuses[student.admission]==s;val color=when(s){DemoStatus.PRESENT->Color(0xFF16845B);DemoStatus.ABSENT->Color(0xFFC44848);DemoStatus.LATE->Color(0xFFC37912)};Button(onClick={statuses=statuses+(student.admission to s)},modifier=Modifier.weight(1f),colors=ButtonDefaults.buttonColors(containerColor=if(selected)color else Color(0xFFE8EDF0),contentColor=if(selected)Color.White else Color.DarkGray),contentPadding=PaddingValues(vertical=8.dp)){Text(s.name.lowercase().replaceFirstChar{it.uppercase()},style=MaterialTheme.typography.labelSmall)}}}}}}
   item{Button(onClick={confirm=true},modifier=Modifier.fillMaxWidth().height(54.dp)){Text("SUBMIT ATTENDANCE")};Spacer(Modifier.height(12.dp))}
  }
 }}
}

@Composable private fun DemoCount(label:String,value:Int,color:Color,modifier:Modifier){Surface(modifier,shape=RoundedCornerShape(8.dp),color=Color.White){Column(Modifier.padding(9.dp),horizontalAlignment=Alignment.CenterHorizontally){Text(value.toString(),fontWeight=FontWeight.Bold,color=color);Text(label,style=MaterialTheme.typography.labelSmall)}}}

