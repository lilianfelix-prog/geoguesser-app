var O,K,J=null,X=null,T=null;var H,F=!0,Y=0,Z=0,I=5;function G(){let j=new URLSearchParams(window.location.search),A=j.get("urllat"),q=j.get("urllng");return{urllat:A?parseFloat(A):null,urllng:q?parseFloat(q):null}}function N(){b(),O=new google.maps.Map(document.getElementById("map"),{center:{lat:0,lng:0},zoom:2,streetViewControl:!1,fullscreenControl:!1}),K=new google.maps.StreetViewPanorama(document.getElementById("street-view"),{position:{lat:0,lng:0},pov:{heading:0,pitch:0},zoom:1,addressControl:!1,showRoadLabels:!1}),O.addListener("click",(j)=>{if(F&&j.latLng)D(j.latLng)}),z()}function b(){let j=document.createElement("div");j.className="game-controls",j.innerHTML=`
      <div class="game-info">
        <div id="score">Score: 0</div>
        <div id="round">Round: 1/${I}</div>
      </div>
      <button id="guess-btn" disabled>Make Guess</button>
      <button id="next-btn" disabled>Next Round</button>
    `,document.getElementsByClassName("controls-container")[0].appendChild(j),document.getElementById("guess-btn")?.addEventListener("click",E),document.getElementById("next-btn")?.addEventListener("click",z)}async function z(){x(),F=!0,Z++,w();let j=document.getElementById("guess-btn"),A=document.getElementById("next-btn");j.disabled=!0,A.disabled=!0;try{let{urllat:q,urllng:C}=G();if(q!==null&&C!==null){H={lat:q,lng:C};let U=new google.maps.StreetViewService,Q=5000,W=new google.maps.LatLng(H.lat,H.lng);U.getPanorama({location:W,radius:Q},async(_,y)=>{if(y===google.maps.StreetViewStatus.OK&&_&&_.location)K.setPano(_.location.pano),K.setPov({heading:0,pitch:0}),K.setVisible(!0);else console.warn("No Street View found for URL parameters location.")})}else await $()}catch(q){console.error("Error fetching location:",q),alert("Error fetching location. Please try again.")}}async function $(){try{let j=await B();if(!j)throw new Error("Failed to fetch a valid location.");H=j;let A=new google.maps.LatLng(H.lat,H.lng);return new Promise((q,C)=>{new google.maps.StreetViewService().getPanorama({location:A,radius:5000},(Q,W)=>{if(W===google.maps.StreetViewStatus.OK&&Q&&Q.location)K.setPano(Q.location.pano),K.setPov({heading:0,pitch:0}),K.setVisible(!0),q(!0);else if(W===google.maps.StreetViewStatus.ZERO_RESULTS)console.warn("Rate limit exceeded, waiting before retry..."),setTimeout(()=>{q(!1)},2000);else console.warn("No Street View found, trying another location..."),setTimeout(()=>{q(!1)},1000)})}).then(async(q)=>{if(!q)return await new Promise((C)=>setTimeout(C,1000)),$();return!0})}catch(j){return console.error("Error in street view search:",j),await new Promise((A)=>setTimeout(A,2000)),$()}}async function B(){try{return H=(await(await fetch("/api/location/random")).json()).actualLocation,H}catch(j){console.error("Error fetching location:",j),alert("Error fetching location. Please try again.")}}function D(j){if(J)J.setMap(null);J=new google.maps.Marker({position:j,map:O});let A=document.getElementById("guess-btn");A.disabled=!1}function x(){if(J)J.setMap(null),J=null;if(X)X.setMap(null),X=null;if(T)T.setMap(null),T=null}async function E(){if(!J){alert("Please select a location on the map first!");return}F=!1;let j={lat:J.getPosition().lat(),lng:J.getPosition().lng()};try{let q=await(await fetch("/api/guess",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({guessLocation:j,actualLocation:H})})).json();Y+=q.score,V(q.score,q.distance),P(j,H);let C=document.getElementById("next-btn");if(Z<I)C.disabled=!1;else setTimeout(()=>{alert(`Game over! Final score: ${Y}. Play again?`),Y=0,Z=0,z()},2000)}catch(A){console.error("Error calculating score:",A),alert("Error processing your guess. Please try again.")}}function P(j,A){let q=new google.maps.LatLng(Number(A.lat),Number(A.lng));X=new google.maps.Marker({position:q,map:O,icon:{url:"https://maps.google.com/mapfiles/ms/icons/green-dot.png"}}),T=new google.maps.Polyline({path:[{lat:j.lat,lng:j.lng},{lat:q.lat(),lng:q.lng()}],geodesic:!0,strokeColor:"#FF0000",strokeOpacity:1,strokeWeight:2}),T.setMap(O);let C=new google.maps.LatLngBounds;C.extend(new google.maps.LatLng(j.lat,j.lng)),C.extend(new google.maps.LatLng(A.lat,A.lng)),O.fitBounds(C)}function V(j,A){let q=document.getElementById("score");if(q)q.textContent=`Score: ${Y} (+${j}) - Distance: ${Math.round(A)} km`}function w(){let j=document.getElementById("round");if(j)j.textContent=`Round: ${Z}/${I}`}window.initialize=N;
