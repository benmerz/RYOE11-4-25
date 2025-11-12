-- ###### USE plays.db ##################################
Select rusher_player_id, rusher_player_name, ydstogo, yards_gained
from teams
where rush_attempt = 1

Select ydstogo, avg(yards_gained) as avg_yards_gained
from teams
where CAST(rush_attempt AS INT) = 1
group by ydstogo

--New query ryoe
Select rusher_player_name, rusher_player_id, yards_gained, 
yards_gained - (0.17091241*ydstogo + 3.07422453) as ryoe,
from teams
where CAST(rush_attempt AS INT) = 1


--Total RYOE by player
select rusher_player_name, rusher_player_id,
avg(yards_gained - (0.12588674*ydstogo + 3.47336519)) as total_ryoe,
count(*) as rush_attempts
from plays
where CAST(rush_attempt AS INT) = 1
group by rusher_player_name, rusher_player_id
having count(*) >= 100
order by total_ryoe desc